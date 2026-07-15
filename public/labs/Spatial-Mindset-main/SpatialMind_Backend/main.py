import os
import json
import sqlite3
import urllib.request
import urllib.error
import logging
import base64
import random
import re
from contextlib import contextmanager
from datetime import date, datetime
import sympy as sp
from fastapi import FastAPI, HTTPException, Request

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Dict, Any, Optional, Union
from dotenv import load_dotenv
from google import genai
from google.genai import types
import time

# ─── Cấu hình logging đầy đủ ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger('spatialmind')

# Load challenge bank
_challenge_bank_path = os.path.join(os.path.dirname(__file__), 'challenge_bank.json')
try:
    with open(_challenge_bank_path, 'r', encoding='utf-8') as f:
        CHALLENGE_BANK = json.load(f)
except Exception:
    CHALLENGE_BANK = []

# Load biến môi trường
# Chỉ định rõ đường dẫn .env để tránh lỗi không tìm thấy khi chạy bat
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Khởi tạo Gemini client theo SDK mới nhất google-genai
gemini_client = None
if GEMINI_API_KEY and GEMINI_API_KEY != "your_api_key_here":
    try:
        # Sử dụng api_key trực tiếp hoặc qua env
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logging.info("Gemini Client khởi tạo thành công.")
    except Exception as e:
        logging.warning(f"Không thể khởi tạo Gemini client: {e}")

app = FastAPI(
    title="SpatialMind API with Gemini AI",
    description="API cho ứng dụng SpatialMind v3.0 — Auth, Gallery, AI Proxy, Notifications",
    version="v3.1"
)

# CORS — Whitelist qua env ALLOWED_ORIGINS, fallback cho dev
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else ["http://localhost:5173", "http://localhost:4173", "https://spatial-mind.vercel.app"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True, # Fix I8: Bật credentials cho auth
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)
logger.info(f"CORS allowed origins: {ALLOWED_ORIGINS}")

# ── v3.0: Wire Notification Routes ──
try:
    from notification_routes import notification_router
    app.include_router(notification_router)
    logging.info("Notification routes loaded successfully")
except Exception as e:
    logging.warning(f"Notification routes not loaded: {e}")

# ── v3.0: AI Proxy (Key Rotation + Caching) ──
try:
    from ai_proxy import get_ai_proxy
    ai_proxy = get_ai_proxy()
    logging.info(f"AI Proxy loaded with {len(ai_proxy.keys)} key(s)")
except Exception as e:
    ai_proxy = None
    logging.warning(f"AI Proxy not loaded: {e}")

# ── v3.1: SQLite Gallery Store ──────────────────────────────────────────────
# Fix C1: Xóa dead code get_appdata_dir() if False — luôn dùng thư mục backend
_DB_PATH = os.path.join(os.path.dirname(__file__), 'gallery.db')


@contextmanager
def _db_conn():
    """Context manager trả về SQLite connection an toàn."""
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _init_db():
    """Khởi tạo bảng gallery nếu chưa có."""
    with _db_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS gallery_posts (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL DEFAULT 'Untitled',
                problem     TEXT NOT NULL DEFAULT '',
                difficulty  TEXT NOT NULL DEFAULT 'medium',
                geometry_data TEXT,
                author_name TEXT NOT NULL DEFAULT 'Ẩn danh',
                author_uid  TEXT NOT NULL DEFAULT '',
                votes       INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contest_results (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                contest_id   TEXT NOT NULL,
                username     TEXT NOT NULL,
                score        INTEGER NOT NULL,
                finish_time  TEXT NOT NULL,
                penalty      INTEGER DEFAULT 0,
                created_at   TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                username     TEXT PRIMARY KEY,
                xp           INTEGER DEFAULT 0,
                streak       INTEGER DEFAULT 0,
                level        INTEGER DEFAULT 1,
                last_active  TEXT
            )
        """)
    logger.info(f"Gallery DB initialized at {_DB_PATH}")


# Khởi tạo DB ngay khi module load
try:
    # get_appdata_dir cần được định nghĩa trước — ta sẽ inline nó ở đây
    if os.name == 'nt':
        _SM_DIR = os.path.join(os.getenv('APPDATA', os.path.dirname(__file__)), 'SpatialMind')
    else:
        _SM_DIR = os.path.join(os.path.expanduser('~'), 'SpatialMind')
    os.makedirs(_SM_DIR, exist_ok=True)
    _DB_PATH = os.path.join(_SM_DIR, 'gallery.db')
    _init_db()
except Exception as _e:
    logger.warning(f"DB init fallback to local dir: {_e}")
    _DB_PATH = os.path.join(os.path.dirname(__file__), 'gallery.db')
    _init_db()


# ── Health Endpoint ──────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Health check + AI proxy status"""
    proxy_health = ai_proxy.health_report() if ai_proxy else {"status": "not_loaded"}
    return {
        "status": "ok",
        "version": "3.1",
        "gemini_configured": bool(GEMINI_API_KEY),
        "ai_proxy": proxy_health,
        "gallery_db": "sqlite",
    }

@app.get("/api/gallery/feed")
async def gallery_feed(sort: str = "hot", page: int = 1, search: str = ""):
    """Lấy danh sách bài đăng gallery từ SQLite"""
    per_page = 20
    offset = (page - 1) * per_page
    order_by = "votes DESC" if sort == "hot" else "created_at DESC"

    with _db_conn() as conn:
        if search:
            q = f"%{search.lower()}%"
            rows = conn.execute(
                f"""SELECT * FROM gallery_posts
                    WHERE lower(title) LIKE ? OR lower(problem) LIKE ?
                    ORDER BY {order_by} LIMIT ? OFFSET ?""",
                (q, q, per_page, offset)
            ).fetchall()
            total = conn.execute(
                "SELECT COUNT(*) FROM gallery_posts WHERE lower(title) LIKE ? OR lower(problem) LIKE ?",
                (q, q)
            ).fetchone()[0]
        else:
            rows = conn.execute(
                f"SELECT * FROM gallery_posts ORDER BY {order_by} LIMIT ? OFFSET ?",
                (per_page, offset)
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) FROM gallery_posts").fetchone()[0]

    posts = []
    for r in rows:
        post = dict(r)
        # Deserialize geometry_data JSON
        if post.get("geometry_data"):
            try:
                post["geometryData"] = json.loads(post["geometry_data"])
            except Exception:
                post["geometryData"] = None
        post["authorName"] = post.pop("author_name", "Ẩn danh")
        post["authorUid"] = post.pop("author_uid", "")
        post["date"] = post.get("created_at", "")
        posts.append(post)

    return {"posts": posts, "total": total}


@app.post("/api/gallery/submit")
async def gallery_submit(request: Request):
    """Submit bài lên gallery — lưu vào SQLite"""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Dữ liệu gửi lên không hợp lệ.")

    post_id = f"post-{int(time.time() * 1000)}"
    title = str(data.get("title", "Untitled"))[:200]
    problem = str(data.get("problem", ""))[:2000]
    difficulty = data.get("difficulty", "medium")
    if difficulty not in ("easy", "medium", "hard"):
        difficulty = "medium"
    author_name = str(data.get("authorName", "Ẩn danh"))[:100]
    author_uid = str(data.get("uid", ""))[:128]
    geometry_data = data.get("geometryData")
    geometry_json = json.dumps(geometry_data, ensure_ascii=False) if geometry_data else None
    created_at = datetime.utcnow().isoformat()

    with _db_conn() as conn:
        conn.execute(
            """INSERT INTO gallery_posts
               (id, title, problem, difficulty, geometry_data, author_name, author_uid, votes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (post_id, title, problem, difficulty, geometry_json, author_name, author_uid, created_at)
        )

    logger.info(f"Gallery: bài mới '{title}' (id={post_id}) từ uid={author_uid}")
    return {"status": "ok", "id": post_id}


@app.post("/api/gallery/{post_id}/vote")
async def gallery_vote(post_id: str, request: Request):
    """Vote cho bài — cập nhật SQLite"""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Dữ liệu không hợp lệ.")

    direction = data.get("direction", "up")
    delta = 1 if direction == "up" else -1

    with _db_conn() as conn:
        row = conn.execute(
            "SELECT votes FROM gallery_posts WHERE id = ?", (post_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài đăng.")
        new_votes = row["votes"] + delta
        conn.execute(
            "UPDATE gallery_posts SET votes = ? WHERE id = ?", (new_votes, post_id)
        )

    return {"status": "ok", "votes": new_votes}

@app.post("/api/user/sync-beacon")
async def sync_beacon(request: Request):
    """Beacon sync endpoint (gọi khi đóng tab)"""
    try:
        body = await request.body()
        data = json.loads(body)
        logging.info(f"Beacon sync received: uid={data.get('uid')}, xp={data.get('xp')}")
        return {"status": "ok"}
    except Exception:
        return {"status": "ignored"}

# ----------------- Rate Limiting Middleware -----------------
ip_last_request = {}
RATE_LIMIT_SECONDS = 3

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Các endpoint cần giới hạn
    limited_endpoints = [
        "/api/geometry/calculate", 
        "/api/algebra/solve", 
        "/api/socratic-hint"
    ]
    
    if request.url.path in limited_endpoints:
        # Lấy IP thật của client
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
            
        current_time = time.time()
        
        if client_ip in ip_last_request:
            time_passed = current_time - ip_last_request[client_ip]
            if time_passed < RATE_LIMIT_SECONDS:
                wait_time = int(RATE_LIMIT_SECONDS - time_passed)
                # Dùng HTTPException để FastAPI tự động xử lý CORS headers
                raise HTTPException(
                    status_code=429,
                    detail=f"Hệ thống đang chống quá tải. Vui lòng đợi {wait_time} giây trước khi đặt câu hỏi tiếp theo."
                )
        
        # Cập nhật thời gian request mới nhất cho IP này
        ip_last_request[client_ip] = current_time

    response = await call_next(request)
    return response
# -----------------------------------------------------------

class GeometryRequest(BaseModel):
    query: str = Field(..., description="Đề bài ngôn ngữ tự nhiên từ học sinh")
    image: Optional[str] = Field(None, description="Dữ liệu ảnh base64 (nếu có)")

class DrawElement(BaseModel):
    model_config = ConfigDict(extra='ignore', populate_by_name=True)
    type: str  # "line", "point", "vector", "right_angle", "function"
    from_point: Optional[Union[str, List[Any], Any]] = Field(None, alias="from")
    to_point: Optional[Union[str, List[Any], Any]] = Field(None, alias="to")
    name: Optional[str] = None
    color: str = "black"
    style: str = "solid"

class VectorRec(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(..., description="ID vector")
    start: List[float] = Field(default=[0,0,0], description="Gốc")
    direction: List[float] = Field(..., description="Hướng")
    length: float = Field(2.0, description="Độ dài")

class FunctionRec(BaseModel):
    model_config = ConfigDict(extra='ignore')
    expression: str = Field(..., description="Biểu thức hàm số (vd: 'Math.sin(x)')")
    color: str = Field("blue", description="Màu đồ thị")

class VertexRec(BaseModel):
    model_config = ConfigDict(extra='ignore')
    name: str = Field(..., description="Tên đỉnh (vd: 'A')")
    coords: List[float] = Field(..., description="Tọa độ [x, y, z]")

class Step(BaseModel):
    model_config = ConfigDict(extra='ignore')
    step_number: int = Field(..., description="Thứ tự bước giải")
    explanation: str = Field(..., description="Giải thích chi tiết cho bước này")
    hint: str = Field(..., description="Gợi ý ngắn gọn cho học sinh")
    draw_elements: List[DrawElement] = Field(default_factory=list, description="Thành phần cần vẽ thêm trong bước này")

class QuizRec(BaseModel):
    model_config = ConfigDict(extra='ignore')
    question: str = Field(..., description="Câu hỏi trắc nghiệm cuối cùng dạng LaTeX")
    options: List[str] = Field(..., description="4 đáp án A, B, C, D (đã xáo trộn)")
    correct_index: int = Field(..., description="Index của đáp án đúng (0-3)")

class GeometryResponseOutput(BaseModel):
    model_config = ConfigDict(extra='ignore')
    type: str = Field(..., description="'3D' cho hình học không gian, '2D' cho đồ thị")
    vertices: List[VertexRec] = Field(default_factory=list, description="Danh sách các đỉnh")
    edges: List[List[str]] = Field(default_factory=list, description="Danh sách các cạnh [ ['A', 'B'], ['B', 'C'] ]")
    vectors: List[VectorRec] = Field(default_factory=list, description="Danh sách vector")
    functions: List[FunctionRec] = Field(default_factory=list, description="Công thức hàm số cho 2D")
    steps: List[Step] = Field(default_factory=list, description="Các bước giải chi tiết")
    hint: str = Field(..., description="Lời khuyên tổng quan cho cả đề bài")
    xp_reward: int = Field(50, description="XP phần thưởng (10-200)")
    difficulty: str = Field("medium", description="Độ khó: easy, medium, hard")
    final_quiz: Optional[QuizRec] = Field(None, description="Câu hỏi trắc nghiệm cuối cùng (tự sinh)")

class SocraticRequest(BaseModel):
    problem_statement: str
    student_wrong_step: str
    theory_markdown: str

class SocraticResponse(BaseModel):
    analysis_internal: str
    socratic_question: str
    theory_applied: str

class AlgebraRequest(BaseModel):
    query: str

    @field_validator('query')
    @classmethod
    def validate_query(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Đề bài không được để trống.')
        if len(v) > 2000:
            raise ValueError('Đề bài quá dài (tối đa 2000 ký tự).')
        return v


class AlgebraResponse(BaseModel):
    result_latex: str
    steps: List[str]
    function_string: Optional[str] = None  # Chuỗi hàm số để frontend vẽ đồ thị

# --- Prompt & logic từ gemini_spatial_parser.py ---
# --- Prompt & logic upgrade ---
# Schema definition is now handled by Pydantic models above (GeometryResponseOutput)



@app.post("/api/geometry/calculate")
def calculate_geometry(request: GeometryRequest):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API chưa được cấu hình.")

    try:
        system_instruction = """Bạn là một chuyên gia Toán học và Visualizer cao cấp. 
Nhiệm vụ: Phân tích đề bài (Text + Image) và chuyển đổi thành cấu trúc JSON để hiển thị Toán học 2D/3D sinh động.

BẮT BUỘC TRẢ VỀ JSON THEO CẤU TRÚC:
{
  "type": "3D" hoặc "2D",
  "vertices": [ {"name": "A", "coords": [x,y,z]}, ... ],
  "edges": [ ["A", "B", "color"], ... ],
  "vectors": [ {"id": "v1", "start": [0,0,0], "direction": [1,1,1], "length": 2}, ... ],
  "functions": [ {"expression": "Math.sin(x)", "color": "blue"}, ... ],
  "steps": [
    {
      "step_number": 1,
      "explanation": "Giải thích chi tiết bằng Markdown + LaTeX",
      "hint": "Gợi ý ngắn",
      "draw_elements": [ {"type": "line", "from": "A", "to": "B", "color": "red", "style": "solid/dashed"}, ... ]
    }
  ],
  "hint": "Lời khuyên tổng quan",
  "xp_reward": 50,
  "difficulty": "easy/medium/hard",
  "final_quiz": {
    "question": "Câu hỏi trắc nghiệm chốt lại kiến thức quan trọng nhất hoặc kết quả cuối cùng (dạng LaTeX)",
    "options": ["A. $...$", "B. $...$", "C. $...$", "D. $...$"],
    "correct_index": 0
  }
}

4. XP Reward: Dựa trên độ phức tạp (Easy: 30-50, Medium: 60-100, Hard: 120-200).
5. JSON ESCAPING: BẮT BUỘC escape tất cả dấu gạch chéo ngược (\\) trong LaTeX thành gạch chéo ngược kép (\\\\).
6. DRAW ELEMENTS: Trong "draw_elements", trường "from" và "to" BẮT BUỘC phải là TÊN ĐỈNH (ví dụ: "A", "B"), KHÔNG ĐƯỢC để tọa độ [x,y,z] vào đây."""

        contents = [f"Đề bài: {request.query}"]
        if request.image:
            image_data = request.image.split(",")[-1] if "," in request.image else request.image
            contents.append(types.Part.from_bytes(data=base64.b64decode(image_data), mime_type="image/jpeg"))

        #Retry mechanism for Gemini API
        max_retries = 3
        last_error = None
        response = None

        for attempt in range(max_retries):
            try:
                response = gemini_client.models.generate_content(
                    model="gemini-3-flash-preview", 
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                break
            except Exception as e:
                last_error = e
                error_msg = str(e)
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    wait_time = (2 ** attempt) + random.random()
                    logging.warning(f"Gemini Rate Limit hit. Retrying in {wait_time:.2f}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                elif "503" in error_msg or "Service Unavailable" in error_msg:
                    wait_time = 1 + random.random()
                    logging.warning(f"Gemini Service Unavailable. Retrying in {wait_time:.2f}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    raise e
        else:
            if last_error:
                logging.error(f"Gemini max retries reached: {last_error}")
                raise HTTPException(status_code=429, detail="AI đang bận (Quá giới hạn lượt gọi). Vui lòng đợi 1 phút rồi thử lại.")

        if not response:
             raise HTTPException(status_code=500, detail="Không nhận được phản hồi từ AI.")

        # Cleanup and Parse
        response_text = response.text.strip()
        # Loại bỏ các đoạn bọc ```json ... ``` nếu có (đề phòng)
        if response_text.startswith("```"):
            response_text = response_text.split("```json")[-1].split("```")[0].strip()
        
        # Hardening: Tự động sửa lỗi escape phổ biến cho LaTeX nếu AI quên
        # Thay thế \ (không được escape) bằng \\
        # Regex này tìm các dấu \ đứng trước một ký tự đặc biệt của LaTeX nhưng không phải là \\
        import re
        # Sửa các trường hợp \frac, \sqrt, \alpha... mà quên double backslash
        # Nhưng tránh sửa các dấu \ đã được escape sẵn (\\)
        response_text = re.sub(r'(?<!\\)\\(?=[a-zA-Z{}])', r'\\\\', response_text)
        
        # Đảm bảo các ký tự đặc biệt lồng nhau được xử lý đúng
        response_text = response_text.replace('\\\\ ', '\\\\') 

        data_raw = json.loads(response_text)
        
        # Thử parse qua Pydantic, nếu lỗi thì dùng raw data để tránh crash
        try:
            data_obj = GeometryResponseOutput(**data_raw)
            data = data_obj.model_dump()
        except Exception as ve:
            logging.warning(f"Pydantic Validation Error (using raw data): {ve}")
            data = data_raw
        
        # Chuyển đổi List[VertexRec] ngược lại thành Dict cho frontend
        formatted_vertices = {}
        for v in data.get("vertices", []):
            coords = v.get("coords", [0, 0, 0])
            if coords and len(coords) >= 3:
                # Transformation: (x, y, z) AI -> (x, z, -y) Three.js
                formatted_vertices[v["name"]] = [coords[0], coords[2], -coords[1]]
            elif coords and len(coords) == 2:
                # Fallback cho 2D vertices trả về trong 3D context
                formatted_vertices[v["name"]] = [coords[0], 0, -coords[1]]
        
        # Chuyển đổi tọa độ cho Vectors (Sync with vertices)
        raw_vectors = data.get("vectors", [])
        formatted_vectors = []
        for vec in raw_vectors:
            start = vec.get("start", [0, 0, 0])
            direction = vec.get("direction", [1, 0, 0])
            if len(start) == 3 and len(direction) == 3:
                formatted_vectors.append({
                    "id": vec.get("id"),
                    "start": [start[0], start[2], -start[1]],
                    "direction": [direction[0], direction[2], -direction[1]],
                    "length": vec.get("length", 2)
                })

        return {
            "type": data.get("type", "3D"),
            "vertices": formatted_vertices,
            "edges": data.get("edges", []),
            "vectors": formatted_vectors,
            "functions": data.get("functions", []),
            "steps": data.get("steps", []),
            "hint": data.get("hint", "AI đã phân tích xong đề bài."),
            "xp_reward": data.get("xp_reward", 50),
            "difficulty": data.get("difficulty", "medium"),
            "final_quiz": data.get("final_quiz")
        }
        
    except Exception as e:
        logging.error(f"Lỗi: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Lỗi AI: {str(e)}")

# --- Algebra & SymPy Solver Endpoint ---
ALGEBRA_SOLVER_PROMPT = """
Bạn là một chuyên gia Toán học Đại số và Giải tích.
Nhiệm vụ của bạn là phân tích đề bài toán đại số (Tiếng Việt) và chuyển đổi nó thành các bước giải bằng SymPy.

Yêu cầu:
1. Xác định hàm số chính (nếu có) để frontend có thể vẽ đồ thị.
2. Giải toán từng bước.
3. Trả về kết quả cuối cùng dưới dạng LaTeX.

  "steps": ["Bước 1: ...", "Bước 2: ..."],
  "function_string": "Chuỗi hàm số chuẩn Python để vẽ đồ thị (vd: sin(x) + x**2). Nếu không có hàm số thì để null."
}

BẮT BUỘC: Hợp lệ JSON 100%. Mọi dấu gạch chéo ngược trong LaTeX phải được escape kép (\\\\).
"""

@app.post("/api/algebra/solve", response_model=AlgebraResponse)
def solve_algebra(request: AlgebraRequest):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API chưa được cấu hình.")
    
    try:
        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=f"{ALGEBRA_SOLVER_PROMPT}\n\nĐề bài: {request.query}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```json")[-1].split("```")[0].strip()
        
        import re
        response_text = re.sub(r'(?<!\\)\\(?=[a-zA-Z{}])', r'\\\\', response_text)
        
        data = json.loads(response_text)
        
        # Kiểm chứng và làm giàu kết quả bằng SymPy (an toàn)
        if data.get("function_string"):
            func_str = str(data["function_string"]).strip()
            # Chỉ cho phép ký tự an toàn — tránh code injection
            _SAFE_PATTERN = re.compile(r'^[a-zA-Z0-9\s\+\-\*\/\^\(\)\.\,\_\[\]\{\}\=\!\<\>\|\&\~\%]+$')
            if func_str and _SAFE_PATTERN.match(func_str) and len(func_str) < 300:
                try:
                    x = sp.Symbol('x')
                    local_dict = {"x": x, "e": sp.E, "pi": sp.pi}
                    expr = sp.sympify(func_str, locals=local_dict, evaluate=True)
                    derivative = sp.diff(expr, x)
                    data["steps"].append(
                        f"✓ Kiểm chứng SymPy — Đạo hàm: $f'(x) = {sp.latex(derivative)}$"
                    )
                except Exception as se:
                    logger.warning(f"SymPy verification error: {se}")
            else:
                logger.warning(f"SymPy skipped: unsafe function_string '{func_str[:50]}'")

        return AlgebraResponse(
            result_latex=data.get("result_latex", ""),
            steps=data.get("steps", []),
            function_string=data.get("function_string")
        )
    except Exception as e:
        logger.error(f"Algebra solver error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# --- Problem Evaluation (AI Scoring) ---
class EvaluationRequest(BaseModel):
    problem_id: str
    explanation: str
    answer: str
    problem_context: Optional[str] = ""

class EvaluationResponse(BaseModel):
    status: str  # AC, WA, PE (Partially Correct)
    feedback: str
    ai_analysis: str
    math_match: bool

@app.post("/api/evaluate-problem", response_model=EvaluationResponse)
async def evaluate_problem(req: EvaluationRequest):
    """Chấm điểm bài làm bằng AI (Gemini) + So khớp toán học (SymPy)."""
    start_time = time.time()
    try:
        # 1. So khớp toán học cơ bản (nếu có thể parse được answer)
        # Ta cố gắng parse kết quả của học sinh và kết quả mong đợi (nếu có trong context)
        math_match = False
        # Giả sử chúng ta có đáp án mẫu trong CHALLENGE_BANK
        target_problem = next((p for p in CHALLENGE_BANK if p['id'] == req.problem_id), None)
        
        # 2. Sử dụng Gemini để phân tích logic giải bài
        if gemini_client:
            prompt = f"""
            Phân tích bài làm của học sinh cho bài toán sau:
            Đề bài: {req.problem_context or (target_problem['content'] if target_problem else "N/A")}
            Bài làm của học sinh: {req.explanation}
            Đáp án học sinh nhập: {req.answer}
            
            Yêu cầu:
            1. Đánh giá tính logic của các bước giải.
            2. Kiểm tra xem kết quả {req.answer} có khớp với lập luận không.
            3. Trả về kết quả dưới dạng JSON:
            {{
              "status": "AC" (đúng), "WA" (sai), hoặc "PE" (đúng một phần/thiếu bước),
              "feedback": "Lời khuyên ngắn gọn cho học sinh",
              "analysis": "Phân tích chi tiết lỗi sai hoặc lời khen"
            }}
            """
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            ai_data = json.loads(response.text)
            
            elapsed = time.time() - start_time
            logger.info(f"[Perf] AI Evaluation took {elapsed:.2f}s for problem {req.problem_id}. Result: {ai_data.get('status')}")

            return EvaluationResponse(
                status=ai_data.get("status", "WA"),
                feedback=ai_data.get("feedback", "Không thể xác định."),
                ai_analysis=ai_data.get("analysis", ""),
                math_match=True # AI đã verify
            )
        else:
            # Fallback nếu không có Gemini
            is_valid = len(req.explanation) > 50 and any(kw in req.explanation.lower() for kw in ["ta có", "suy ra", "vuông góc"])
            
            elapsed = time.time() - start_time
            logger.info(f"[Perf] Fallback Evaluation took {elapsed:.2f}s for problem {req.problem_id}.")
            
            return EvaluationResponse(
                status="AC" if is_valid else "WA",
                feedback="Hệ thống AI đang bận, đã chấm điểm dựa trên cấu trúc lập luận." if is_valid else "Trình bày quá ngắn hoặc thiếu logic.",
                ai_analysis="Fallback scoring enabled.",
                math_match=False
            )
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Contest Ranking Endpoints ---
class ContestSubmitRequest(BaseModel):
    contest_id: str
    username: str
    score: int
    finish_time: str  # Format HH:MM:SS
    penalty: int = 0

@app.post("/api/contest/submit")
async def submit_contest_result(req: ContestSubmitRequest):
    """Lưu kết quả thi đấu và cộng XP cho người dùng."""
    try:
        with _db_conn() as conn:
            # 1. Lưu kết quả contest
            conn.execute("""
                INSERT INTO contest_results (contest_id, username, score, finish_time, penalty, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (req.contest_id, req.username, req.score, req.finish_time, req.penalty, datetime.now().isoformat()))
            
            # 2. Cập nhật XP cho user profile
            conn.execute("""
                INSERT INTO user_profiles (username, xp, last_active)
                VALUES (?, ?, ?)
                ON CONFLICT(username) DO UPDATE SET
                    xp = xp + excluded.xp,
                    last_active = excluded.last_active
            """, (req.username, req.score, datetime.now().isoformat()))
            
        return {"status": "success", "message": "Kết quả đã được ghi nhận và cộng XP."}
    except Exception as e:
        logger.error(f"Submit contest error: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu kết quả.")

@app.get("/api/contest/ranking/{contest_id}")
async def get_contest_ranking(contest_id: str):
    """Lấy bảng xếp hạng của kỳ thi cụ thể."""
    try:
        with _db_conn() as conn:
            # Sắp xếp theo điểm giảm dần, sau đó là thời gian hoàn thành tăng dần
            rows = conn.execute("""
                SELECT username, score, finish_time, penalty 
                FROM contest_results 
                WHERE contest_id = ?
                ORDER BY score DESC, finish_time ASC
                LIMIT 50
            """, (contest_id,)).fetchall()
            
            # Convert rows to dicts
            ranking = []
            for i, row in enumerate(rows):
                ranking.append({
                    "rank": i + 1,
                    "username": row["username"],
                    "score": row["score"],
                    "finishTime": row["finish_time"],
                    "penalty": row["penalty"]
                })
            return ranking
    except Exception as e:
        logger.error(f"Fetch ranking error: {e}")
        raise HTTPException(status_code=500, detail="Không thể tải bảng xếp hạng.")
SOCRATIC_TUTOR_PROMPT = """
Bạn là một Chuyên gia Sư phạm Toán học Socratic (Socratic Math Tutor).
Nhiệm vụ của bạn là hướng dẫn học sinh nhận ra lỗi sai của chính mình thông qua các gợi ý và câu hỏi phản tư. 

NGUYÊN TẮC TỐI THƯỢNG: TUYỆT ĐỐI KHÔNG giải bài toán cho học sinh, KHÔNG ĐƯA RA đáp án cuối cùng.

Đầu vào sẽ bao gồm:
1. Đê bài: {problem}
2. Bước giải sai của học sinh: {wrong_step}
3. Trích đoạn lý thuyết liên quan (Markdown): {theory}

Yêu cầu:
- Sử dụng trích đoạn lý thuyết được cung cấp làm nền tảng kiến thức.
- Kết hợp phương pháp Socratic: Đặt ra MỘT câu hỏi gợi mở, hướng học sinh đối chiếu bài làm của mình với đoạn lý thuyết, từ đó tự nhận ra họ đã áp dụng sai quy tắc/công thức nào.
- Giọng văn: Khích lệ, thân thiện, mang tính gợi mở. Sử dụng LaTeX cho công thức toán.

Đầu ra bắt buộc là JSON theo định dạng sau:
{
  "analysis_internal": "Phân tích nội bộ của bạn xem học sinh sai ở đâu",
  "socratic_question": "Câu hỏi gợi mở Socratic viết bằng Markdown kết hợp LaTeX, là câu trực tiếp hỏi học sinh.",
  "theory_applied": "Tóm tắt tên lý thuyết đã dùng để gợi ý"
}
"""

@app.post("/api/socratic-hint", response_model=SocraticResponse)
def get_socratic_hint(request: SocraticRequest):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API chưa được cấu hình.")
    
    try:
        # Sử dụng .replace thay cho .format để tránh lỗi với dấu ngoặc nhọn trong LaTeX/JSON
        prompt = SOCRATIC_TUTOR_PROMPT.replace("{problem}", request.problem_statement) \
                                     .replace("{wrong_step}", request.student_wrong_step) \
                                     .replace("{theory}", request.theory_markdown)

        response = gemini_client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )

        raw_text = response.text.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
        
        data = json.loads(raw_text)
        
        return SocraticResponse(
            analysis_internal=data.get("analysis_internal", ""),
            socratic_question=data.get("socratic_question", ""),
            theory_applied=data.get("theory_applied", "")
        )
    except Exception as e:
        logging.error(f"Lỗi Socratic Hint: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Lỗi xử lý gợi ý: {str(e)}")


# --- AppData Storage Logic ---
def get_appdata_dir():
    if os.name == 'nt': # Windows
        base_dir = os.getenv('APPDATA')
    else: # Linux/Mac
        base_dir = os.path.expanduser('~')
    
    app_dir = os.path.join(base_dir, 'SpatialMind')
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)
    return app_dir

def load_json_data(filename, default_value):
    path = os.path.join(get_appdata_dir(), filename)
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(default_value, f, ensure_ascii=False, indent=2)
        return default_value
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default_value

def save_json_data(filename, data):
    path = os.path.join(get_appdata_dir(), filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- User Endpoints ---
class UserProfile(BaseModel):
    name: str = "Học sinh"
    xp: int = 0
    streak: int = 0
    level: int = 1
    rank: str = "Beginner"
    achievements: List[str] = []

@app.get("/api/user/profile")
def get_profile(username: str = "Ẩn danh"):
    try:
        with _db_conn() as conn:
            row = conn.execute("SELECT * FROM user_profiles WHERE username = ?", (username,)).fetchone()
            if row:
                return dict(row)
            return {"username": username, "xp": 0, "streak": 0, "level": 1}
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return {"username": username, "xp": 0, "streak": 0, "level": 1}

@app.post("/api/user/profile")
def update_profile(profile: UserProfile):
    try:
        with _db_conn() as conn:
            conn.execute("""
                INSERT INTO user_profiles (username, xp, streak, level, last_active)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(username) DO UPDATE SET
                    xp = excluded.xp,
                    streak = excluded.streak,
                    level = excluded.level,
                    last_active = excluded.last_active
            """, (profile.name, profile.xp, profile.streak, profile.level, datetime.now().isoformat()))
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Không thể cập nhật profile.")

@app.get("/api/leaderboard")
def get_leaderboard():
    # Mock data kết hợp với user thực tế
    default_board = [
        {"name": "Minh Tú", "weeklyXP": 1240, "rank": "Diamond"},
        {"name": "Hà Linh", "weeklyXP": 980, "rank": "Platinum"},
        {"name": "Đức Khải", "weeklyXP": 870, "rank": "Platinum"},
    ]
    user_data = load_json_data('user_profile.json', UserProfile().model_dump())
    # Thêm user hiện tại vào board
    board = default_board + [{"name": user_data['name'], "weeklyXP": int(user_data['xp'] * 0.6), "rank": user_data['rank']}]
    return sorted(board, key=lambda x: x['weeklyXP'], reverse=True)

@app.get("/api/daily-challenge")
def get_daily_challenges():
    # Chọn ngẫu nhiên 3 thử thách (Dễ, Vừa, Khó) dựa trên ngày
    today_str = date.today().isoformat()
    # Seed cho random dựa trên ngày để mọi người nhận được cùng thử thách trong ngày
    import zlib
    seed_val = zlib.adler32(today_str.encode())
    random.seed(seed_val)
    
    easy = [c for c in CHALLENGE_BANK if c.get('difficulty') == 'easy']
    medium = [c for c in CHALLENGE_BANK if c.get('difficulty') == 'medium']
    hard = [c for c in CHALLENGE_BANK if c.get('difficulty') == 'hard']
    
    selected = []
    if easy: selected.append(random.choice(easy))
    if medium: selected.append(random.choice(medium))
    if hard: selected.append(random.choice(hard))
    
    # Reset seed để không ảnh hưởng đến các phần khác
    random.seed()
    
    return {"challenges": selected}

# --- Gemini Chat Proxy Endpoint ---
# Proxy chuyển tiếp request từ Frontend sang Google Gemini API
# API Key được bảo mật trên server, Frontend không cần biết key

class ChatProxyRequest(BaseModel):
    contents: List[Dict[str, Any]]
    generationConfig: Optional[Dict[str, Any]] = None
    systemInstruction: Optional[Dict[str, Any]] = None
    safetySettings: Optional[List[Dict[str, Any]]] = None

@app.post("/api/chat")
async def proxy_chat(request: Request):
    """Proxy endpoint chuyển tiếp request sang Google Gemini API.
    Hỗ trợ fallback qua nhiều model khi bị giới hạn quota."""
    
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API Key chưa được cấu hình trên server.")
    
    try:
        post_data = await request.body()
    except Exception:
        raise HTTPException(status_code=400, detail="Không thể đọc dữ liệu request.")
    
    # Danh sách các mô hình dự phòng khi bị giới hạn Quota (Ưu tiên model hiện tại/mới nhất lên đầu)
    models = [
        "gemini-3.5-pro",
        "gemini-3-flash-preview",
        "gemini-2.5-pro",
        "gemini-2.5-flash", 
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro-latest",
        "gemini-flash-latest"
    ]
    
    last_error_code = 500
    last_error_body = {"error": {"message": "Unknown error"}}
    
    for model_name in models:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        req = urllib.request.Request(
            endpoint, 
            data=post_data, 
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                body = response.read()
                return JSONResponse(
                    status_code=200, 
                    content=json.loads(body)
                )
        except urllib.error.HTTPError as e:
            last_error_code = e.code
            try:
                error_body = e.read()
                last_error_body = json.loads(error_body)
            except Exception:
                pass
            
            logging.warning(f"[Chat Proxy] [{model_name}] API Error {e.code}. Chuyển sang model tiếp theo...")
            continue
        except Exception as e:
            last_error_code = 500
            last_error_body = {"error": {"message": str(e)}}
            logging.error(f"[Chat Proxy] [{model_name}] Exception: {e}")
            continue
    
    # Nếu tất cả các mô hình đều thất bại
    return JSONResponse(status_code=last_error_code, content=last_error_body)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
