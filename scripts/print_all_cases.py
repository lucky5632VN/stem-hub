import json

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    cases = json.load(f)['cases']

for i, c in enumerate(cases):
    cid = c.get('id', '')
    subj = c.get('subject', '')
    q = c.get('question', '')[:60].replace('\n', ' ')
    corpus = c.get('corpus_status') or c.get('corpusStatus') or c.get('in_corpus') or ''
    # Check if there is any mention of CAND or tier
    print(f"{i+1:3d}. {cid:<18} | {subj:<5} | {corpus:<25} | {q}")

