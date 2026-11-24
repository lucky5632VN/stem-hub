import json

with open("reports/ablation/official_candidates.json", "r", encoding="utf-8") as f:
    cands = json.load(f)

print(f"Total candidates in official_candidates.json: {len(cands)}")
by_tier = {}
for c in cands:
    t = c.get("kb_tier", c.get("tier", "UNKNOWN"))
    by_tier.setdefault(t, []).append(c)

for t, items in by_tier.items():
    print(f"\nTier '{t}': {len(items)} items")
    for it in items:
        print(f"  {it['id']} | {it.get('subject')} | {it.get('part')} | Ans: {it.get('official_answer')} | Computed: {it.get('computed_answer')}")
        print(f"    Q: {it.get('question')[:80].replace(chr(10), ' ')}")

