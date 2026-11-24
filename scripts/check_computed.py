import json

with open("reports/ablation/official_candidates.json", "r", encoding="utf-8") as f:
    cands = json.load(f)

comp = [c for c in cands if c.get("verificationMethod") == "computed_independent"]
print(f"Total computed_independent: {len(comp)}")
for i, c in enumerate(comp):
    print(f"[{i+1:02d}] {c['id']:12s} | {c['subject']:4s} | {c['question_number']:18s} | Ans: {str(c['official_answer']):8s} | Cov: {str(c['corpus_coverage']):12s}")

other = [c for c in cands if c.get("verificationMethod") != "computed_independent"]
print(f"\nOther (not computed_independent): {len(other)}")
for i, c in enumerate(other):
    print(f"[{i+1:02d}] {c['id']:12s} | {c['subject']:4s} | {c['question_number']:18s} | Ans: {str(c['official_answer']):8s} | Method: {c.get('verificationMethod')}")

