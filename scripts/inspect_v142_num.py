import json

with open('reports/ablation/ablation_dataset_100.v1.4.2.json', 'r', encoding='utf-8') as f:
    d = json.load(f)
cases = d['cases']
print('v1.4.2 status:', d.get('status'))
print('v1.4.2 strata_summary:', d.get('strata_summary'))
num_cases = [c for c in cases if 'NUM' in c.get('id', '')]
print(f'Number of NUM cases in v1.4.2: {len(num_cases)}')
for c in num_cases:
    cid = c['id']
    cand_id = c.get('candidate_id', 'N/A')
    subj = c.get('subject', 'N/A')
    stratum = c.get('corpus_stratum', 'N/A')
    tier = 'A' if 'tang_A' in stratum else ('B' if 'tang_B' in stratum else ('C' if 'tang_C' in stratum else 'N/A'))
    gt = str(c.get('ground_truth', 'N/A'))[:10]
    q = c.get('question', '').replace('\n', ' ')[:50]
    print(f"{cid:<15} | {cand_id:<15} | {subj:<5} | {tier:<4} | {stratum:<30} | {gt:<10} | {q}")

