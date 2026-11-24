import json

with open("reports/ablation/official_candidates.json", "r", encoding="utf-8") as f:
    cands = json.load(f)

print(f"Total candidates: {len(cands)}")
for i, c in enumerate(cands):
    cid = c.get("id")
    subj = c.get("subject")
    qpart = c.get("question_number")
    ans = c.get("official_answer")
    calc = c.get("calculated_value")
    cov = c.get("corpus_coverage")
    qtext = c.get("question_text", "")[:70]
    print(f"[{i+1:02d}] {cid:12s} | {subj:4s} | {qpart:18s} | Ans: {str(ans):8s} | Cov: {str(cov):12s} | Q: {qtext}...")

