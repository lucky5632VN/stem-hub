import json
import re

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

cmap = {c['id']: c for c in corpus}

# Danh sách 24 câu computed_independent và chunk đề xuất
# Kiểm tra xem quote có là substring nguyên văn của chunk['content'] không
candidates = [
    # TOÁN (10 câu)
    ("CAND_MATH_01", "toan-12-228", "Toán", "Thể tích elip tròn xoay khoét lỗ trụ"),
    ("CAND_MATH_02", "toan-10-169", "Toán", "Hệ phương trình 3 ẩn mua rau quả"),
    ("CAND_MATH_03", "toan-11-210", "Toán", "Xác suất 4 bóng đỏ vào 3 hình vuông"),
    ("CAND_MATH_04", "toan-12-223", "Toán", "Khoảng cách từ điểm P đến (MED)"),
    ("CAND_MATH_05", "toan-12-214", "Toán", "Cực trị tối ưu hóa hàm lợi nhuận"),
    ("CAND_MATH_06", "toan-10-170", "Toán", "Nghiệm hệ bất phương trình bậc nhất 2 ẩn"),
    ("CAND_MATH_07", "toan-11-205", "Toán", "Nghiệm phương trình logarit cơ số 3"),
    ("CAND_MATH_08", "toan-11-210", "Toán", "Quy tắc nhân xác suất biến cố độc lập"),
    ("CAND_MATH_09", "toan-12-221", "Toán", "Tọa độ vectơ AB"),
    ("CAND_MATH_10", "toan-11-196", "Toán", "Số hạng cấp số cộng u2 = u1 + d"),
    # HÓA (4 câu)
    ("CAND_CHEM_01", "hoa-12-075", "Hóa", "% khoáng C2S trong xi măng"),
    ("CAND_CHEM_02", "hoa-11-037", "Hóa", "Hiệu suất chuyển hóa methane"),
    ("CAND_CHEM_04", "hoa-12-084", "Hóa", "Sức điện động chuẩn pin Zn-Pb"),
    ("CAND_CHEM_05", "hoa-12-054", "Hóa", "Cân bằng sấy ẩm đường"),
    # LÝ (6 câu)
    ("CAND_PHYS_01", "ly-12-165", "Lý", "Năng lượng điện pin hạt nhân"),
    ("CAND_PHYS_02", "ly-12-165", "Lý", "Số hạt plutonium còn lại sau 25 năm"),
    ("CAND_PHYS_03", "ly-12-140", "Lý", "Độ tăng áp suất lốp xe đẳng tích"),
    ("CAND_PHYS_04", "ly-12-142", "Lý", "Phần trăm khối lượng khí xả bớt"),
    ("CAND_PHYS_05", "ly-11-125", "Lý", "Cường độ dòng điện cảm ứng"),
    ("CAND_PHYS_06", "ly-11-118", "Lý", "Công suất tỏa nhiệt trên điện trở"),
    # SINH (4 câu)
    ("CAND_BIO_01", "sinh-12-301", "Sinh", "Kích thước quần thể ngải dại ô nghiên cứu"),
    ("CAND_BIO_02", "sinh-12-295", "Sinh", "Tần số alen M2 trong quần thể"),
    ("CAND_BIO_03", "sinh-12-261", "Sinh", "Xác suất kiểu gen dị hợp 2 cặp F1"),
    ("CAND_BIO_04", "sinh-11-239", "Sinh", "Chênh lệch thời gian pha dãn chung")
]

print("=== KIỂM TRA TỪNG CHUNK CỦA 24 CÂU ===")
for cid, chunk_id, subj, desc in candidates:
    if chunk_id not in cmap:
        print(f"❌ [{cid}] Chunk {chunk_id} KHÔNG TỒN TẠI trong 303 chunks!")
    else:
        c = cmap[chunk_id]
        content = c['content']
        print(f"✅ [{cid}] {chunk_id} | {c['topic']} ({len(content)} chars)")
        print(f"   Preview: {content[:120]}...")

