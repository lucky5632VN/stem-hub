import os
import json
import logging
import time
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# --- SCHEMA DEFINITIONS ---

class VertexInfo(BaseModel):
    name: str = Field(..., description="Tên điểm (ví dụ: 'A', 'S', 'M')")
    x: float = Field(..., description="Tọa độ x")
    y: float = Field(..., description="Tọa độ y")
    z: float = Field(..., description="Tọa độ z")

class DrawElement(BaseModel):
    type: str = Field(..., description="Loại phần tử: 'line' hoặc 'point'")
    from_point: Optional[str] = Field(None, alias="from", description="Tên điểm bắt đầu (nếu là line)")
    to_point: Optional[str] = Field(None, alias="to", description="Tên điểm kết thúc (nếu là line)")
    name: Optional[str] = Field(None, description="Tên điểm (nếu là point)")
    color: str = Field("black", description="Màu sắc: 'red', 'blue', 'green', 'black'")
    style: str = Field("solid", description="Kiểu đường: 'solid' (nét liền) hoặc 'dashed' (nét đứt)")

class Step(BaseModel):
    step_number: int = Field(..., description="Số thứ tự của bước giải")
    explanation: str = Field(..., description="Lời giải thích chi tiết bằng Tiếng Việt cho bước này")
    draw_elements: List[DrawElement] = Field(..., description="Mảng các đoạn thẳng hoặc điểm cần vẽ thêm ở bước này")

class GeometryProblem(BaseModel):
    vertices: List[VertexInfo] = Field(..., description="Mảng chứa thông tin tọa độ của tất cả các điểm (kể cả điểm phụ)")
    edges: List[List[str]] = Field(..., description="Mảng các mảng chứa cặp tên điểm tạo thành các cạnh khung gốc")
    steps: List[Step] = Field(..., description="Mảng các bước giải chi tiết kèm chỉ dẫn vẽ 3D")

# --- SYSTEM PROMPT ---

SYSTEM_PROMPT = """
Bạn là một chuyên gia Toán học Hình học Không gian và AI Backend Developer.
Nhiệm vụ của bạn là phân tích đề bài toán hình học không gian (Tiếng Việt) và chuyển đổi nó thành một cấu trúc JSON nghiêm ngặt để hiển thị 3D.

QUY TẮC TÍNH TOÁN TỌA ĐỘ (LUÔN TUÂN THỦ):
1. Hệ trục Oxyz: 
   - Đáy thường nằm trên mặt phẳng (Oxy), tức z=0.
   - Gốc tọa độ O(0,0,0) nên đặt tại một đỉnh của đáy (thường là A) hoặc tâm đáy.
2. Chiều dài các cạnh (Tỷ lệ tương đối):
   - Nếu đề bài cho "cạnh a", hãy coi a = 2.0.
   - Chiều cao hình chóp h = 3.0.
   - Hình chữ nhật có thể dùng tỷ lệ 2:3.
3. Các hình khối cơ bản:
   - Hình vuông ABCD đáy: A(0,0,0), B(2,0,0), C(2,2,0), D(0,2,0).
   - Hình chóp S.ABCD có SA ⊥ đáy: S(0,0,3). (S nằm trên trục Oz).
   - Trung điểm M của SD: M = (S + D) / 2 = (0, 1, 1.5).
4. Logic vẽ:
   - Một đường thẳng được coi là 'dashed' (nét đứt) nếu nó nằm bên trong hoặc bị các mặt khác che khuất trong góc nhìn 3D thông thường.
   - Cạnh SA, AB, AD thường là nét đứt nếu S là đỉnh chóp và ABCD là đáy.

QUY TẮC TRẢ VỀ JSON:
- LUÔN LUÔN trả về JSON hợp lệ theo schema.
- Thêm đầy đủ các điểm phụ (H, M, N...) vào object `vertices`.
- Trong `steps`, mỗi bước phải có `explanation` rõ ràng và `draw_elements` phản ánh hành động toán học đó.
- Sử dụng màu sắc ('red', 'blue') để làm nổi bật các đối tượng được nhắc đến trong bước giải.
"""

class GeometryAnalyzer:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-3-flash-preview"

    def analyze(self, query: str) -> GeometryProblem:
        print(f"Đang phân tích đề bài: {query}")
        
        example_json = {
            "vertices": [
                {"name": "A", "x": 0.0, "y": 0.0, "z": 0.0},
                {"name": "S", "x": 0.0, "y": 0.0, "z": 3.0}
            ],
            "edges": [["A", "B"], ["S", "A"]],
            "steps": [
                {
                    "step_number": 1,
                    "explanation": "Vẽ đáy ABCD và đỉnh S...",
                    "draw_elements": [
                        {"type": "line", "from": "A", "to": "B", "color": "black", "style": "dashed"}
                    ]
                }
            ]
        }

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Đề bài: {query}\n\n"
            f"BẮT BUỘC: Phản hồi định dạng JSON đúng schema như ví dụ sau:\n"
            f"{json.dumps(example_json, ensure_ascii=False, indent=2)}\n\n"
            f"HÃY ĐẢM BẢO `draw_elements` là danh sách các object, không phải chuỗi."
        )

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )

        # Thử lại tối đa 3 lần nếu gặp lỗi server (503, 429)
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model_id,
                    contents=prompt,
                    config=config
                )
                break # Thành công
            except Exception as e:
                last_error = e
                if "503" in str(e) or "429" in str(e):
                    logging.warning(f"Lỗi Gemini (Lần {attempt+1}/{max_retries}): {e}. Đang thử lại...")
                    time.sleep(2 * (attempt + 1))
                    continue
                raise e
        else:
            raise last_error

        # Parsing thủ công
        raw_text = response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
        
        data = json.loads(raw_text)
        return GeometryProblem.model_validate(data)

if __name__ == "__main__":
    if not GEMINI_API_KEY:
        print("LỖI: Vui lòng cấu hình GEMINI_API_KEY trong file .env")
    else:
        analyzer = GeometryAnalyzer(GEMINI_API_KEY)
        
        # Test case mẫu
        sample_query = "Cho hình chóp S.ABCD đáy là hình vuông cạnh a, SA vuông góc với đáy. Gọi M là trung điểm của SD. Kẻ AH vuông góc với SB tại H."
        
        try:
            result = analyzer.analyze(sample_query)
            
            # Chuyển đổi format vertices về dạng Dictionary như user yêu cầu
            # Đổi trục tọa độ sang hệ Three.js: Trục Y thành chiều cao, mặt XZ làm đáy
            formatted_vertices = {v.name: [v.x, v.z, -v.y] for v in result.vertices}
            
            # Reconstruct output
            output_data = {
                "vertices": formatted_vertices,
                "edges": result.edges,
                "steps": [s.model_dump(by_alias=True) for s in result.steps]
            }
            
            # Xuất kết quả đẹp mắt
            print("\n=== KẾT QUẢ PHÂN TÍCH JSON (CHUẨN ĐỊNH DẠNG) ===")
            print(json.dumps(output_data, indent=2, ensure_ascii=False))
            
            print(f"\nSố lượng điểm: {len(formatted_vertices)}")
            print(f"Số bước giải: {len(result.steps)}")
            
        except Exception as e:
            print(f"Có lỗi xảy ra: {e}")
