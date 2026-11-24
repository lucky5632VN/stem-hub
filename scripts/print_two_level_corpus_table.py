import json
import os

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

corpus_map = {item['id']: item for item in corpus}

# Bảng phân loại 2 mức cho 24 câu computed_independent
# Mức: "chủ đề liên quan, chưa đủ để giải" (công thức/định nghĩa cơ bản) vs "kho đủ để giải" (đặc thù/chi tiết) vs "ngoài kho"
classifications = [
    # TOAN (10 câu)
    {
        "id": "CAND_MATH_01", "subject": "Toán", "question": "Thể tích elip tròn xoay khoét lỗ trụ",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "toan-12-228",
        "excerpt": "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x) quanh trục Ox"
    },
    {
        "id": "CAND_MATH_02", "subject": "Toán", "question": "Hệ phương trình ma trận chi phí 3 sản phẩm",
        "level": "ngoài kho", "chunkId": "toan-10-169",
        "excerpt": "Bất phương trình bậc nhất hai ẩn x, y có dạng ax + by < c (kho không có ma trận 3x3)"
    },
    {
        "id": "CAND_MATH_03", "subject": "Toán", "question": "Xác suất chọn 4 viên bi đủ màu có điều kiện",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "toan-11-210",
        "excerpt": "Xác suất của biến cố A là P(A) = n(A) / n(Omega) với n(A) là số kết quả thuận lợi"
    },
    {
        "id": "CAND_MATH_04", "subject": "Toán", "question": "Khoảng cách từ điểm đến mặt phẳng Oxyz",
        "level": "kho đủ để giải", "chunkId": "toan-12-223",
        "excerpt": "Khoảng cách từ điểm M0(x0, y0, z0) đến mặt phẳng (alpha): d = |Ax0 + By0 + Cz0 + D| / sqrt(A^2+B^2+C^2)"
    },
    {
        "id": "CAND_MATH_05", "subject": "Toán", "question": "Cực trị tối ưu hóa hàm lợi nhuận P(x)",
        "level": "kho đủ để giải", "chunkId": "toan-12-214",
        "excerpt": "Điểm cực trị hàm số: giải f'(x) = 0 và xét dấu đạo hàm f'(x) để tìm cực đại"
    },
    {
        "id": "CAND_MATH_06", "subject": "Toán", "question": "Miền nghiệm hệ bất phương trình bậc nhất hai ẩn",
        "level": "kho đủ để giải", "chunkId": "toan-10-170",
        "excerpt": "Đường thẳng ax + by = c chia mặt phẳng tọa độ Oxy. Miền nghiệm xác định bằng điểm thử"
    },
    {
        "id": "CAND_MATH_07", "subject": "Toán", "question": "Giải phương trình logarit cơ số 3",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "toan-11-205",
        "excerpt": "Phương trình log_a(x) = b tương đương x = a^b với điều kiện cơ số a > 0 và a != 1"
    },
    {
        "id": "CAND_MATH_08", "subject": "Toán", "question": "Quy tắc nhân xác suất biến cố độc lập P(AB)",
        "level": "kho đủ để giải", "chunkId": "toan-11-210",
        "excerpt": "Hai biến cố A và B độc lập khi và chỉ khi P(AB) = P(A) * P(B)"
    },
    {
        "id": "CAND_MATH_09", "subject": "Toán", "question": "Tọa độ vectơ AB trong không gian Oxyz",
        "level": "kho đủ để giải", "chunkId": "toan-12-221",
        "excerpt": "Vectơ AB có tọa độ là (xB - xA; yB - yA; zB - zA) trong không gian Oxyz"
    },
    {
        "id": "CAND_MATH_10", "subject": "Toán", "question": "Số hạng cấp số cộng u2 = u1 + d",
        "level": "kho đủ để giải", "chunkId": "toan-11-196",
        "excerpt": "Cấp số cộng có số hạng tổng quát un = u1 + (n - 1)*d, un+1 = un + d"
    },
    # HOA (4 câu)
    {
        "id": "CAND_CHEM_01", "subject": "Hóa", "question": "Hàm lượng khoáng C2S trong clinker xi măng",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "hoa-12-075",
        "excerpt": "Thành phần silicat và quá trình sản xuất xi măng poóc lăng từ đá vôi và sét"
    },
    {
        "id": "CAND_CHEM_02", "subject": "Hóa", "question": "Hiệu suất tổng hợp amoniac Haber (N2 + 3H2)",
        "level": "kho đủ để giải", "chunkId": "hoa-11-037",
        "excerpt": "Cân bằng hóa học N2 + 3H2 <=> 2NH3 và công thức tính hiệu suất theo chất thiếu"
    },
    {
        "id": "CAND_CHEM_04", "subject": "Hóa", "question": "Sức điện động pin Galvanic Zn-Pb E_pin",
        "level": "kho đủ để giải", "chunkId": "hoa-12-067",
        "excerpt": "Sức điện động chuẩn của pin điện hóa: E_pin = E0(catot) - E0(anot) với catot có thế cao hơn"
    },
    {
        "id": "CAND_CHEM_05", "subject": "Hóa", "question": "Bảo toàn khối lượng cô đặc dung dịch đường",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "hoa-12-054",
        "excerpt": "Saccarozơ và dung dịch đường glucozơ, độ tan và quá trình kết tinh dung dịch"
    },
    # LY (6 câu)
    {
        "id": "CAND_PHYS_01", "subject": "Lý", "question": "Năng lượng điện phát ra từ phân rã phóng xạ",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "ly-12-161",
        "excerpt": "Định luật phóng xạ N(t) = N0 * 2^(-t/T) và năng lượng tỏa ra trong mỗi phân rã hạt"
    },
    {
        "id": "CAND_PHYS_02", "subject": "Lý", "question": "Số hạt nhân còn lại sau 25 năm phân rã",
        "level": "kho đủ để giải", "chunkId": "ly-12-161",
        "excerpt": "Số hạt nhân chưa phân rã còn lại tại thời điểm t tính theo N = N0 * e^(-lambda * t)"
    },
    {
        "id": "CAND_PHYS_03", "subject": "Lý", "question": "Độ tăng áp suất khí đẳng tích theo nhiệt độ K",
        "level": "kho đủ để giải", "chunkId": "ly-12-140",
        "excerpt": "Định luật Sác-lơ: Trong quá trình đẳng tích của lượng khí xác định, áp suất tỉ lệ thuận nhiệt độ tuyệt đối"
    },
    {
        "id": "CAND_PHYS_04", "subject": "Lý", "question": "Độ giảm khối lượng khí khi giữ áp suất không đổi",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "ly-12-142",
        "excerpt": "Phương trình trạng thái khí lí tưởng pV = nRT = (m/M)*RT liên hệ khối lượng và nhiệt độ"
    },
    {
        "id": "CAND_PHYS_05", "subject": "Lý", "question": "Cường độ dòng điện cảm ứng thanh kim loại chuyển động",
        "level": "kho đủ để giải", "chunkId": "ly-11-125",
        "excerpt": "Suất điện động cảm ứng trong đoạn dây: e = B*v*l*sin(theta); dòng cảm ứng I = e / R"
    },
    {
        "id": "CAND_PHYS_06", "subject": "Lý", "question": "Công suất tỏa nhiệt trên điện trở mạch cảm ứng",
        "level": "kho đủ để giải", "chunkId": "ly-11-118",
        "excerpt": "Công suất tỏa nhiệt theo định luật Jun-Len-xơ: P = I^2 * R = U^2 / R"
    },
    # SINH (4 câu)
    {
        "id": "CAND_BIO_01", "subject": "Sinh", "question": "Ước lượng kích thước quần thể bằng ô tiêu chuẩn",
        "level": "kho đủ để giải", "chunkId": "sinh-12-286",
        "excerpt": "Kích thước quần thể và phương pháp đo đạc: mật độ trung bình nhân diện tích phân bố"
    },
    {
        "id": "CAND_BIO_02", "subject": "Sinh", "question": "Tần số alen M2 trong quần thể đa alen",
        "level": "kho đủ để giải", "chunkId": "sinh-12-273",
        "excerpt": "Cấu trúc di truyền quần thể: Tần số alen bằng số lượng alen đó chia tổng số alen"
    },
    {
        "id": "CAND_BIO_03", "subject": "Sinh", "question": "Xác suất kiểu gen YyGg ở đời con F1",
        "level": "kho đủ để giải", "chunkId": "sinh-12-261",
        "excerpt": "Quy luật phân ly độc lập Menđen: Tỷ lệ mỗi loại kiểu gen bằng tích tỷ lệ từng cặp tính trạng"
    },
    {
        "id": "CAND_BIO_04", "subject": "Sinh", "question": "Chênh lệch thời gian pha dãn chung khi nhịp tim đổi",
        "level": "chủ đề liên quan, chưa đủ để giải", "chunkId": "sinh-11-239",
        "excerpt": "Chu kỳ hoạt động của tim: pha co tâm nhĩ, co tâm thất và dãn chung theo tỉ lệ thời gian"
    }
]

print(f"{'STT':<4} | {'ID':<14} | {'Môn':<6} | {'Phân loại nhãn kho':<22} | {'Chunk ID':<13} | {'Trích đoạn <=20 từ':<60}")
print("-" * 125)
for idx, c in enumerate(classifications, 1):
    # Trích đoạn <= 20 từ
    words = c['excerpt'].split()[:20]
    short_excerpt = " ".join(words)
    print(f"{idx:<4} | {c['id']:<14} | {c['subject']:<6} | {c['level']:<22} | {c['chunkId']:<13} | {short_excerpt:<60}")

# Thống kê
counts = {}
for c in classifications:
    lvl = c['level']
    counts[lvl] = counts.get(lvl, 0) + 1
print("\nTHỐNG KÊ:")
for k, v in counts.items():
    print(f"  - {k}: {v} câu")
