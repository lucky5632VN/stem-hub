import json

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    v141 = json.load(f)
    cases = v141['cases']
    meta = v141['metadata']

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    cands_raw = json.load(f)
    cands = {c['id']: c for c in cands_raw}

# Look at all cases in v1.4.1
print(f"Total cases in v1.4.1: {len(cases)}")
print("Categories in cases:", set(c.get('category') for c in cases))
print("Tiers in cases:", set(c.get('tier') for c in cases))

# Check groups_summary
groups = meta.get('groups_summary', {})
print("\nGroups in metadata:")
for gname, ginfo in groups.items():
    print(f"  {gname}: total={ginfo.get('total')}, cases={len(ginfo.get('cases', []))}")

# Check 24 candidates defined in metadata:
# 4 in A, 16 in B, 4 in C
tier_A = groups.get('tang_A_kho_du_de_giai', {}).get('cases', [])
tier_B = groups.get('tang_B_chu_de_lien_quan_chua_du_de_giai', {}).get('cases', [])
tier_C = groups.get('tang_C_ngoai_kho', {}).get('cases', [])
cand_24 = {}
for cid in tier_A: cand_24[cid] = 'A'
for cid in tier_B: cand_24[cid] = 'B'
for cid in tier_C: cand_24[cid] = 'C'

print(f"\n24 Candidates defined in metadata: {len(cand_24)} cases")
print("  Tier A (4):", tier_A)
print("  Tier B (16):", tier_B)
print("  Tier C (4):", tier_C)

# Now check cases in v1.4.1
# What are the IDs in v1.4.1?
print("\nFirst 35 cases in v1.4.1:")
for i, c in enumerate(cases[:35]):
    cid = c.get('candidate_id') or c.get('official_id') or 'NONE'
    print(f"  {i+1}. id={c.get('id')} subj={c.get('subject')} cat={c.get('category')} tier={c.get('tier')} cand={cid} q={c.get('question', '')[:50]}")
