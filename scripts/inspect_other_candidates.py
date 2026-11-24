import json

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

already_computed = {
    'CAND_MATH_01', 'CAND_MATH_02', 'CAND_MATH_03', 'CAND_MATH_04', 'CAND_MATH_05',
    'CAND_MATH_06', 'CAND_MATH_07', 'CAND_MATH_08', 'CAND_MATH_09', 'CAND_MATH_10',
    'CAND_CHEM_01', 'CAND_CHEM_02', 'CAND_CHEM_04', 'CAND_CHEM_05',
    'CAND_PHYS_01', 'CAND_PHYS_02', 'CAND_PHYS_03', 'CAND_PHYS_04', 'CAND_PHYS_05', 'CAND_PHYS_06',
    'CAND_BIO_01', 'CAND_BIO_02', 'CAND_BIO_03', 'CAND_BIO_04'
}

print(f"Total candidates: {len(data)}. Listing candidates not in already_computed:")
for c in data:
    if c['id'] not in already_computed:
        q_text = c.get('question_text', '').replace('\n', ' ')[:75]
        print(f"{c['id']} | {c.get('subject')} | {c.get('question_num')} | {c.get('official_answer')} | {q_text}")
