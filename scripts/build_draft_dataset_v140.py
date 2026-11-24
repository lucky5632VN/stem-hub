import json
import os
import sys

# Đọc tập dữ liệu gốc 100 câu
SRC_PATH = os.path.join('reports', 'ablation', 'ablation_dataset_100.json')
DRAFT_PATH = os.path.join('reports', 'ablation', 'ablation_dataset_100.v1.4.0.DRAFT.json')

with open(SRC_PATH, 'r', encoding='utf-8') as f:
    orig_data = json.load(f)

# Phân tầng 24 ứng viên số học chính thức (computed_independent) thành 3 tầng:
# Tầng A: 4 câu "kho đủ để giải"
# Tầng B: 16 câu "chủ đề liên quan, chưa đủ để giải"
# Tầng C: 4 câu "ngoài kho"
# Quy tắc: Kho tri thức (stem-corpus.json) tuyệt đối KHÔNG được bổ sung sau khi xem đề.
CANDIDATE_STRATIFICATION_24 = {
    # Tầng A (4 câu) - Kho đủ để giải
    "CAND_MATH_04": {"stratum": "tang_A_kho_du_de_giai", "label_display": "kho đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "toan-12-233"},
    "CAND_MATH_06": {"stratum": "tang_A_kho_du_de_giai", "label_display": "kho đủ để giải", "part": "Phần I",   "difficulty": "medium_mcq",    "chunk_id": "toan-10-170"},
    "CAND_MATH_10": {"stratum": "tang_A_kho_du_de_giai", "label_display": "kho đủ để giải", "part": "Phần I",   "difficulty": "medium_mcq",    "chunk_id": "toan-11-196"},
    "CAND_BIO_02":  {"stratum": "tang_A_kho_du_de_giai", "label_display": "kho đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "sinh-12-295"},

    # Tầng B (16 câu) - Chủ đề liên quan, chưa đủ để giải
    "CAND_MATH_01": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "toan-12-228"},
    "CAND_MATH_03": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "toan-11-210"},
    "CAND_MATH_05": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "toan-12-214"},
    "CAND_MATH_07": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần I",   "difficulty": "medium_mcq",    "chunk_id": "toan-12-218"},
    "CAND_MATH_08": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần I",   "difficulty": "medium_mcq",    "chunk_id": "toan-11-210"},
    "CAND_MATH_09": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần I",   "difficulty": "medium_mcq",    "chunk_id": "toan-10-179"},
    "CAND_CHEM_02": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "hoa-11-034"},
    "CAND_CHEM_04": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "hoa-12-084"},
    "CAND_CHEM_05": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "hoa-12-073"},
    "CAND_PHYS_01": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "ly-12-165"},
    "CAND_PHYS_02": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "ly-12-165"},
    "CAND_PHYS_05": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "ly-11-128"},
    "CAND_PHYS_06": {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "ly-11-120"},
    "CAND_BIO_01":  {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "sinh-12-301"},
    "CAND_BIO_03":  {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "sinh-12-293"},
    "CAND_BIO_04":  {"stratum": "tang_B_chu_de_lien_quan_chua_du_de_giai", "label_display": "chủ đề liên quan, chưa đủ để giải", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "sinh-11-275"},

    # Tầng C (4 câu) - Ngoài kho
    "CAND_MATH_02": {"stratum": "tang_C_ngoai_kho", "label_display": "ngoài kho", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "không có chunk liên quan"},
    "CAND_CHEM_01": {"stratum": "tang_C_ngoai_kho", "label_display": "ngoài kho", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "không có chunk liên quan"},
    "CAND_PHYS_03": {"stratum": "tang_C_ngoai_kho", "label_display": "ngoài kho", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "không có chunk liên quan"},
    "CAND_PHYS_04": {"stratum": "tang_C_ngoai_kho", "label_display": "ngoài kho", "part": "Phần III", "difficulty": "hard_fill_in", "chunk_id": "không có chunk liên quan"}
}

# Mapping từ ABL_IN_NUM_01..24 sang CAND_* tương ứng theo bảng đối chiếu chính thức
CAND_MAPPING_FOR_ABL_NUM = {
    "ABL_IN_NUM_01": "CAND_MATH_01",
    "ABL_IN_NUM_02": "CAND_MATH_02",
    "ABL_IN_NUM_03": "CAND_MATH_03",
    "ABL_IN_NUM_04": "CAND_MATH_04",
    "ABL_IN_NUM_05": "CAND_MATH_05",
    "ABL_IN_NUM_06": "CAND_MATH_06",
    "ABL_IN_NUM_07": "CAND_MATH_07",
    "ABL_IN_NUM_08": "CAND_MATH_08",
    "ABL_IN_NUM_09": "CAND_MATH_09",
    "ABL_IN_NUM_10": "CAND_MATH_10",
    "ABL_IN_NUM_11": "CAND_PHYS_01",
    "ABL_IN_NUM_12": "CAND_PHYS_02",
    "ABL_IN_NUM_13": "CAND_PHYS_03",
    "ABL_IN_NUM_14": "CAND_PHYS_04",
    "ABL_IN_NUM_15": "CAND_PHYS_05",
    "ABL_IN_NUM_16": "CAND_PHYS_06",
    "ABL_IN_NUM_17": "CAND_CHEM_01",
    "ABL_IN_NUM_18": "CAND_CHEM_02",
    "ABL_IN_NUM_19": "CAND_CHEM_04",
    "ABL_IN_NUM_20": "CAND_CHEM_05",
    "ABL_IN_NUM_21": "CAND_BIO_01",
    "ABL_IN_NUM_22": "CAND_BIO_02",
    "ABL_IN_NUM_23": "CAND_BIO_03",
    "ABL_IN_NUM_24": "CAND_BIO_04"
}

draft_metadata = {
    "name": "STEM HUB Ablation Stratified 100 Benchmark (v1.4.0 DRAFT)",
    "version": "1.4.0-DRAFT",
    "status": "DRAFT_PENDING_USER_APPROVAL",
    "note": "Bản nháp v1.4.0 phân tách rõ 3 tầng dữ liệu số học chính thức: Tầng A (4 câu: kho đủ để giải), Tầng B (16 câu: chủ đề liên quan, chưa đủ để giải), Tầng C (4 câu: ngoài kho). Kho tri thức cố định, không được bổ sung sau khi xem đề. Báo cáo kết quả độc lập theo từng tầng riêng biệt, chỉ mô tả thống kê cho cỡ mẫu n nhỏ, tuyệt đối KHÔNG gộp chung thành một điểm số tổng.",
    "corpus_freeze_statement": "kho không được bổ sung sau khi xem đề",
    "reporting_rule": "Báo cáo độc lập theo từng tầng riêng biệt: Tầng A (n=4), Tầng B (n=16), Tầng C (n=4). Với cỡ mẫu nhỏ n, chỉ báo cáo thống kê mô tả (số câu đúng/tổng số câu), tuyệt đối không suy diễn hay gộp chung điểm số.",
    "groups_summary": {
        "tang_A_kho_du_de_giai": {
            "description": "Tầng A: Kho đủ để giải (n=4) - Cung cấp trực tiếp công thức/phương pháp đầy đủ",
            "total": 4,
            "cases": ["CAND_MATH_04", "CAND_MATH_06", "CAND_MATH_10", "CAND_BIO_02"]
        },
        "tang_B_chu_de_lien_quan_chua_du_de_giai": {
            "description": "Tầng B: Chủ đề liên quan, chưa đủ để giải (n=16) - Có khái niệm nền nhưng thiếu bước/công thức đặc thù",
            "total": 16,
            "cases": [
                "CAND_MATH_01", "CAND_MATH_03", "CAND_MATH_05", "CAND_MATH_07", "CAND_MATH_08", "CAND_MATH_09",
                "CAND_CHEM_02", "CAND_CHEM_04", "CAND_CHEM_05",
                "CAND_PHYS_01", "CAND_PHYS_02", "CAND_PHYS_05", "CAND_PHYS_06",
                "CAND_BIO_01", "CAND_BIO_03", "CAND_BIO_04"
            ]
        },
        "tang_C_ngoai_kho": {
            "description": "Tầng C: Ngoài kho (n=4) - Hoàn toàn không có chunk liên quan trong kho 303 chunks",
            "total": 4,
            "cases": ["CAND_MATH_02", "CAND_CHEM_01", "CAND_PHYS_03", "CAND_PHYS_04"]
        },
        "in_scope_concept": {
            "description": "Câu khái niệm trong phạm vi SGK chuẩn GDPT 2018 (cần chuyên gia/người chấm)",
            "total": 40
        },
        "out_of_scope_concept": {
            "description": "Câu khái niệm ngoài phạm vi SGK (kiểm thử bộ ngắt từ chối fail-closed)",
            "total": 36
        }
    },
    "total_cases": 100
}

# Tạo bản nháp cases giữ nguyên các trường cần thiết và gắn nhãn phân tầng v1.4.0
draft_cases = []
for c in orig_data.get('cases', []):
    item = dict(c)
    cid = item.get('id')
    
    # Kiểm tra xem có nằm trong 24 câu số học chính thức không
    cand_id = CAND_MAPPING_FOR_ABL_NUM.get(cid)
    if cand_id and cand_id in CANDIDATE_STRATIFICATION_24:
        meta = CANDIDATE_STRATIFICATION_24[cand_id]
        item['official_candidate_id'] = cand_id
        item['corpus_stratum'] = meta['stratum']
        item['corpus_label'] = meta['label_display']
        item['exam_part'] = meta['part']
        item['difficulty_stratum'] = meta['difficulty']
        item['relevant_chunk_id'] = meta['chunk_id']
        item['dataset_v140_group'] = meta['stratum']
    elif item.get('stratum') == 'in_scope_numerical':
        # Các câu số học phụ trợ còn lại trong bộ 30 câu
        item['dataset_v140_group'] = 'supplementary_numerical'
        item['corpus_stratum'] = 'supplementary'
        item['corpus_label'] = 'bổ trợ kiểm thử'
        item['difficulty_stratum'] = 'hard_fill_in'
    elif item.get('stratum') == 'in_scope_concept':
        item['dataset_v140_group'] = 'in_scope_concept'
        item['corpus_stratum'] = 'in_scope_concept'
        item['difficulty_stratum'] = 'concept'
    else:
        item['dataset_v140_group'] = 'out_of_scope_concept'
        item['corpus_stratum'] = 'out_of_scope_concept'
        item['difficulty_stratum'] = 'out_of_scope'
        
    draft_cases.append(item)

draft_dataset = {
    "metadata": draft_metadata,
    "cases": draft_cases
}

with open(DRAFT_PATH, 'w', encoding='utf-8') as f:
    json.dump(draft_dataset, f, ensure_ascii=False, indent=2)

print(f"✅ Đã tạo thành công bản nháp: {DRAFT_PATH}")
print(f"📊 Tổng số cases: {len(draft_cases)}")
print("🔒 Lưu ý: File dataset chính thức reports/ablation/ablation_dataset_100.json KHÔNG bị sửa đổi; hash được bảo toàn.")
