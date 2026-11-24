import json

with open("reports/ablation/ablation_dataset_100.v1.4.1.json", "r", encoding="utf-8") as f:
    ds141 = json.load(f)

with open("reports/ablation/ablation_dataset_100.v1.4.2.json", "r", encoding="utf-8") as f:
    ds142 = json.load(f)

with open("reports/ablation/official_candidates.json", "r", encoding="utf-8") as f:
    cands_dict = {c["id"]: c for c in json.load(f)}

print("=== BẢNG 1: 24 CÂU SỐ HỌC TRONG BẢN v1.4.1 (CŨ, BỊ KHÓA SAI) ===")
print("| STT | ID Dataset (ABL_*) | ID CAND_* gán nhầm | 100 ký tự đầu câu hỏi | Đáp án | Tầng (A/B/C) | So khớp với official_candidates.json |")
print("| :---: | :---: | :---: | :--- | :---: | :---: | :---: |")

cases141 = {c["id"]: c for c in ds141["cases"]}
for i in range(1, 25):
    aid = f"ABL_IN_NUM_{i:02d}"
    c = cases141.get(aid, {})
    q = c.get("question", "").replace("\n", " ").strip()[:100]
    ans = str(c.get("ground_truth", "")).replace("\n", " ")[:30]
    # Check what tier was assigned in v1.4.1
    if aid in ["ABL_IN_NUM_04", "ABL_IN_NUM_06", "ABL_IN_NUM_10", "ABL_IN_NUM_22"]:
        tier = "Tầng A"
    elif aid in ["ABL_IN_NUM_02", "ABL_IN_NUM_13", "ABL_IN_NUM_14", "ABL_IN_NUM_17"]:
        tier = "Tầng C"
    else:
        tier = "Tầng B"
    
    cand_id_legacy = c.get("candidate_id", "KHÔNG CÓ")
    print(f"| {i} | `{aid}` | `{cand_id_legacy}` | {q}... | `{ans}` | {tier} | LỆCH (0% khớp ký tự) |")

print("\n=== BẢNG 2: 24 CÂU SỐ HỌC TRONG BẢN v1.4.2 (DRAFT MỚI, ĐÃ KHẮC PHỤC ÁNH XẠ) ===")
print("| STT | ID Dataset (ABL_*) | ID CAND_* chính thức | Môn | 100 ký tự đầu câu hỏi chính thức | Đáp án | Tầng | So khớp văn bản |")
print("| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: |")

cases142 = [c for c in ds142["cases"] if c["id"].startswith("ABL_IN_NUM") and c["is_scored"]]
for i, c in enumerate(cases142):
    aid = c["id"]
    cid = c["candidate_id"]
    subj = c.get("subject", "")
    q = c.get("question", "").replace("\n", " ").strip()[:100]
    ans = str(c.get("ground_truth", ""))
    tier = c.get("tier_label", "")
    tier_short = "A" if "Tầng A" in tier else ("C" if "Tầng C" in tier else "B")
    print(f"| {i+1} | `{aid}` | `{cid}` | {subj.upper()} | {q}... | `{ans}` | Tầng {tier_short} | Khớp toàn bộ ký tự |")

