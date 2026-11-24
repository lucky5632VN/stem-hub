import json

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    cands = {c['id']: c for c in json.load(f)}

with open('reports/ablation/ablation_dataset_100.v1.4.2.json', 'r', encoding='utf-8') as f:
    ds142 = json.load(f)

num_cases = [c for c in ds142['cases'] if c['id'].startswith('ABL_IN_NUM') and c['is_scored']]
print(f'Total scored numerical in v1.4.2: {len(num_cases)}')

matched = 0
for c in num_cases:
    cid = c['candidate_id']
    cand = cands.get(cid)
    assert cand is not None, f"Missing candidate {cid}"
    if c['question'] == cand['question_text']:
        matched += 1
    else:
        print(f"Mismatch for {c['id']} vs {cid}")

print(f"Khớp từng ký tự văn bản: {matched}/{len(num_cases)}")

