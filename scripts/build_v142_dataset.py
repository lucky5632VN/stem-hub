import json
import hashlib
from datetime import datetime, timezone

def sha256_text(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    cands = json.load(f)

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    ds141 = json.load(f)

cases141 = ds141['cases']
concept_cases = [c for c in cases141 if c['id'].startswith('ABL_IN_CONCEPT')]
oos_cases = [c for c in cases141 if c['id'].startswith('ABL_OOS')]
legacy_num_25_30 = [c for c in cases141 if c['id'] in [f'ABL_IN_NUM_{i:02d}' for i in range(25, 31)]]

print(f"Loaded {len(concept_cases)} concept cases, {len(oos_cases)} OOS cases, {len(legacy_num_25_30)} supplementary cases.")

# 24 computed_independent candidates
comp_cands = [c for c in cands if c.get('verificationMethod') == 'computed_independent']
print(f"Loaded {len(comp_cands)} computed_independent candidates.")

# Define tiers for the 24 candidates
tier_A_ids = {'CAND_MATH_04', 'CAND_MATH_06', 'CAND_MATH_10', 'CAND_BIO_02'}
tier_C_ids = {'CAND_MATH_02', 'CAND_CHEM_01', 'CAND_PHYS_03', 'CAND_PHYS_04'}

new_numerical_cases = []
for i, cand in enumerate(comp_cands):
    abl_id = f"ABL_IN_NUM_{i+1:02d}"
    cid = cand['id']
    if cid in tier_A_ids:
        tier = 'tang_A_kho_du_de_giai'
        tier_label = 'Tầng A (kho đủ để giải)'
    elif cid in tier_C_ids:
        tier = 'tang_C_ngoai_kho'
        tier_label = 'Tầng C (ngoài kho)'
    else:
        tier = 'tang_B_chu_de_lien_quan_chua_du_de_giai'
        tier_label = 'Tầng B (chủ đề liên quan, chưa đủ để giải)'

    # Keywords for evaluation
    eval_kw = [str(cand.get('official_answer', '')).strip()]
    calc_val = str(cand.get('calculated_value', '')).strip()
    if calc_val and calc_val != eval_kw[0]:
        eval_kw.append(calc_val)

    case_obj = {
        "id": abl_id,
        "candidate_id": cid,
        "subject": cand.get("subject"),
        "question": cand.get("question_text"),
        "ground_truth": cand.get("official_answer"),
        "calculated_value": cand.get("calculated_value"),
        "stratum": "in_scope_numerical",
        "corpus_stratum": tier,
        "tier_label": tier_label,
        "is_scored": True,
        "evaluation_keywords": eval_kw,
        "exam_name": cand.get("exam_name"),
        "exam_code": cand.get("exam_code"),
        "question_number": cand.get("question_number"),
        "verificationMethod": cand.get("verificationMethod"),
        "source_type": "nguồn thứ cấp: báo đăng lại đề/đáp án Bộ GD&ĐT; chép bởi trợ lý; đối chiếu bởi người dùng",
        "source_url": cand.get("source_url"),
        "evidence_file": cand.get("evidence_file"),
        "crop_exam_file": cand.get("crop_exam_file"),
        "crop_key_file": cand.get("crop_key_file"),
        "author_provenance": "nguồn thứ cấp: báo đăng lại đề/đáp án Bộ GD&ĐT; chép bởi trợ lý; đối chiếu bởi người dùng",
        "user_ticked": True,
        "notes": cand.get("notes")
    }
    new_numerical_cases.append(case_obj)

# Prepare 6 supplementary cases (ABL_IN_NUM_25 to 30) - NOT SCORED, NOT in refusal measurement set
supplementary_cases = []
for c in legacy_num_25_30:
    c_copy = dict(c)
    c_copy["stratum"] = "supplementary_unscored"
    c_copy["corpus_stratum"] = "bo_tro_khong_cham"
    c_copy["tier_label"] = "Bổ trợ, không chấm (Toán số học do AI tự soạn)"
    c_copy["is_scored"] = False
    c_copy["author_provenance"] = "AI tự soạn bổ trợ, không chấm"
    c_copy["user_ticked"] = False
    c_copy["notes"] = "6 câu bài toán số học do AI tự soạn để dự phòng; loại khỏi nhóm đo từ chối và tập chấm chính thức."
    supplementary_cases.append(c_copy)

# Prepare concept cases: tag provenance
for c in concept_cases:
    c["is_scored"] = True
    c["stratum"] = "in_scope_concept"
    c["author_provenance"] = c.get("author_provenance", "Tập khái niệm GDPT 2018 (đối soát SGK)")

# Prepare OOS cases: tag provenance (strictly 30 questions)
for c in oos_cases:
    c["is_scored"] = True
    c["stratum"] = "out_of_scope"
    c["author_provenance"] = "Tập câu hỏi ngoài phạm vi GDPT 2018 (dùng đo tỷ lệ từ chối)"

all_cases = concept_cases + new_numerical_cases + oos_cases + supplementary_cases

v142_data = {
    "version": "v1.4.2",
    "status": "DRAFT (CHƯA KHÓA - Chờ lệnh tường minh 'khóa v1.4.2' từ người dùng)",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "description": "Bộ dữ liệu đánh giá 100 câu v1.4.2 DRAFT: Ánh xạ chuẩn xác 24 câu số học chính thức (CAND_*) vào 3 tầng A:4, B:16, C:4; Tách riêng 6 câu bổ trợ không chấm; Giữ nguyên 30 câu ngoài phạm vi đo từ chối.",
    "strata_summary": {
        "scored_cases_total": 94,
        "supplementary_unscored_total": 6,
        "total_cases": 100,
        "in_scope_concept": len(concept_cases),
        "in_scope_numerical_scored": len(new_numerical_cases),
        "out_of_scope_scored": len(oos_cases),
        "numerical_3_tiers": {
            "tang_A_kho_du_de_giai": sum(1 for c in new_numerical_cases if c['corpus_stratum'] == 'tang_A_kho_du_de_giai'),
            "tang_B_chu_de_lien_quan_chua_du_de_giai": sum(1 for c in new_numerical_cases if c['corpus_stratum'] == 'tang_B_chu_de_lien_quan_chua_du_de_giai'),
            "tang_C_ngoai_kho": sum(1 for c in new_numerical_cases if c['corpus_stratum'] == 'tang_C_ngoai_kho')
        }
    },
    "corpus_freeze_statement": "kho không được bổ sung sau khi xem đề",
    "cases": all_cases
}

output_path = 'reports/ablation/ablation_dataset_100.v1.4.2.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(v142_data, f, ensure_ascii=False, indent=2)

sha256 = sha256_text(open(output_path, 'r', encoding='utf-8').read())
print(f"Generated {output_path}")
print(f"Total cases: {len(all_cases)} (Scored: 94, Supplementary: 6)")
print(f"SHA-256: {sha256}")

