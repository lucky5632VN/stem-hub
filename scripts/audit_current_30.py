import json

with open('reports/ablation/ablation_dataset_100.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cases = data['cases']
print("Case 0 keys:", cases[0].keys())
print("Case 0:", cases[0])
slices = set(c.get('group', c.get('slice', c.get('category', ''))) for c in cases)
print("Groups/slices:", slices)

# find numerical cases
for c in cases:
    if 'num' in c.get('id', '').lower() or 'num' in str(c).lower():
        print(c['id'], c.get('group'), c.get('category'), c.get('question', c.get('prompt', ''))[:80])
