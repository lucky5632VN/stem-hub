import json

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    cands = json.load(f)

print(f"Total in official_candidates.json: {len(cands)}")
for c in cands:
    cid = c.get('id', '')
    subj = c.get('subject', '')
    tier = c.get('tier', '')
    q = c.get('question', '').strip().replace('\n', ' ')
    print(f"{cid:<15} | {subj:<6} | {tier:<10} | {q[:80]}")

