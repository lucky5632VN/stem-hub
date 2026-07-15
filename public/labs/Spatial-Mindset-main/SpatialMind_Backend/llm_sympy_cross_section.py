import sympy as sp
from sympy.geometry import Point3D, Plane, Segment3D, Polygon
import json

# ==========================================
# PHẦN 1: PROMPT ENGINEERING (Dành cho LLM)
# ==========================================
# Mục tiêu: Ngăn chặn LLM ảo giác (hallucination) bằng cách ép nó 
# sinh ra cấu trúc code SymPy chuẩn xác, giới hạn các hàm được sử dụng,
# và cung cấp một hệ quy chiếu tọa độ cụ thể.

SYSTEM_PROMPT = """
Bạn là một trợ lý Toán học 3D chuyên nghiệp. 
Nhiệm vụ của bạn là dịch đề bài hình học không gian thành mã code máy tính sử dụng thư viện SymPy (Python).

Các quy tắc BẮT BUỘC để tránh ảo giác:
1. LUÔN LUÔN giả định một hệ trục tọa độ Oxyz. Ví dụ cho hình chóp S.ABCD đáy hình vuông cạnh a=1, chiều cao h=1:
   A(0,0,0), B(1,0,0), C(1,1,0), D(0,1,0), S(0.5,0.5,1).
2. CHỈ sử dụng các class sau từ sympy.geometry: `Point3D`, `Segment3D`, `Line3D`, `Plane`.
3. Để tìm giao điểm, dùng `plane.intersection(segment)`. Nhớ kiểm tra kết quả trả về có rỗng không.
4. Trả về kết quả đầu ra thuần túy là code Python, không in ra markdown format hay giải thích dài dòng.
"""

USER_PROMPT = """
Đề bài: Cho hình chóp S.ABCD có đáy ABCD là hình vuông. Đặt S nằm trên trục đi qua tâm đáy. 
Hãy tìm các đỉnh của đa giác thiết diện tạo bởi mặt phẳng (MNC) và hình chóp, 
với M là trung điểm SA, N là trung điểm SB và C là đỉnh của đáy.
"""

# ==========================================
# PHẦN 2: MÔ PHỎNG ĐẦU RA CỦA LLM & TÍNH TOÁN (SYM PY)
# ==========================================
# Dưới đây là đoạn code tương đương với những gì cụm LLM + Prompt phía trên sẽ sinh ra, 
# kết hợp logic toán giải tích không gian trực tiếp bằng SymPy.

def calculate_cross_section():
    # 1. Khởi tạo Không gian tọa độ (Tạo base case chuẩn)
    # Gán tọa độ các đỉnh
    A = Point3D(0, 0, 0)
    B = Point3D(1, 0, 0)
    C = Point3D(1, 1, 0)
    D = Point3D(0, 1, 0)
    # Tâm đáy
    O = Point3D(1/2, 1/2, 0)
    # Đỉnh S
    S = Point3D(1/2, 1/2, 1)

    # 2. Xác định các điểm đặc biệt từ đề bài LLM phân tích
    # Trung điểm: tọa độ = (Đỉnh_1 + Đỉnh_2) / 2
    M = S.midpoint(A) # Trung điểm SA
    N = S.midpoint(B) # Trung điểm SB

    # 3. Khởi tạo mặt phẳng cắt (Plane) đi qua 3 điểm M, N, C
    cutting_plane = Plane(M, N, C)

    # 4. Tìm các giao điểm của mặt phẳng này với các cạnh của khối đa diện
    # Các cạnh của hình chóp có thể bị cắt (trừ đỉnh C, SA, SB vì đã chứa M,N,C):
    # - Cạnh SD
    # - Các cạnh đáy: AD, CD (thường sẽ đi qua C rồi nên chỉ xem có cắt AD ở giữa ko)
    edges_to_check = [
        Segment3D(S, D), # Cạnh SD
        Segment3D(A, D)  # Tính cả AD đề phòng trường hợp cắt
    ]

    cross_section_vertices = [M, N, C]

    for edge in edges_to_check:
        intersection = cutting_plane.intersection(edge)
        # Hàm intersection của SymPy trả về list các điểm (hoặc rỗng)
        if intersection and isinstance(intersection[0], Point3D):
            pt = intersection[0]
            # Loại trừ trùng lặp điểm nếu có
            if pt not in cross_section_vertices:
                cross_section_vertices.append(pt)

    # 5. Output ra màn hình (hoặc chuyển thành JSON trả cho Frontend FastAPI của bạn)
    vertices_json = []
    print("=== KẾT QUẢ TÍNH TOÁN THIẾT DIỆN SYM PY ===")
    for i, pt in enumerate(cross_section_vertices):
        # Trích xuất dạng số thực (float) để Frontend dễ vẽ
        vx, vy, vz = float(pt.x), float(pt.y), float(pt.z)
        print(f"Đỉnh {i+1}: ({vx:.2f}, {vy:.2f}, {vz:.2f})")
        vertices_json.append({"x": vx, "y": vy, "z": vz})

    # (Logic nâng cao để gửi qua Frontend: cần sắp xếp các đỉnh theo thứ tự nối vòng của đa giác
    # thông qua thuật toán lồi convex hull 3d hoặc chéo mặt phẳng, nhưng ở bài toán này M,N,C,P 
    # tạo thành 1 chu trình nối đơn giản.)

    return vertices_json


if __name__ == "__main__":
    calculate_cross_section()
