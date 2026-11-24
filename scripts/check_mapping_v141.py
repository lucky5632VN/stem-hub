import json

with open("reports/ablation/official_candidates.json", "r", encoding="utf-8") as f:
    cands = json.load(f)

with open("reports/ablation/ablation_dataset_100.v1.4.1.json", "r", encoding="utf-8") as f:
    ds141 = json.load(f)

cases141 = {c["id"]: c for c in ds141["cases"]}

print(f"Total candidates: {len(cands)}")
cand_by_id = {c["id"]: c for c in cands}

print("=== SO SÁNH 24 CÂU SỐ HỌC TRONG v1.4.1 VỚI official_candidates.json ===")

# In v1.4.1, let's see how they were defined
matched_count = 0
deviated_list = []

for i in range(1, 25):
    abl_id = f"ABL_IN_NUM_{i:02d}"
    c = cases141.get(abl_id, {})
    q141 = c.get("question", "").strip()
    ans141 = str(c.get("ground_truth", "")).strip()
    tier141 = c.get("corpus_stratum", c.get("tier", "N/A"))
    ref_cand = c.get("candidate_id", c.get("source_candidate", "KHÔNG CÓ"))
    
    # Try to find matching candidate in official_candidates.json by question text
    found_cand = None
    for cand in cands:
        cand_q = cand.get("question", "").strip()
        # check exact text match
        if cand_q == q141:
            found_cand = cand
            break
        # check if 50+ chars match
        elif cand_q[:50] == q141[:50] and len(cand_q) > 30:
            found_cand = cand
            break

    if found_cand and found_cand.get("question", "").strip() == q141:
        matched_count += 1
        print(f"[{i}] {abl_id} == {found_cand['id']} (KHỚP TOÀN BỘ KÝ TỰ)")
    else:
        deviated_list.append((abl_id, ref_cand, q141[:60], ans141, found_cand.get('id') if found_cand else 'KHÔNG KHỚP'))

print(f"\nSố câu khớp hoàn toàn ký tự văn bản: {matched_count}/24")
print(f"Số câu lệch: {len(deviated_list)}/24")
print("Danh sách lệch:")
for item in deviated_list:
    print(f"  - {item[0]} | Ref: {item[1]} | Khớp text: {item[4]} | Q: {item[2]} | Ans: {item[3]}")

