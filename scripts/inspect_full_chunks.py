import json

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

for c in corpus:
    if c['id'] in ['ly-12-163', 'ly-12-164', 'ly-12-165', 'hoa-12-082', 'hoa-12-083', 'hoa-12-084', 'sinh-12-301', 'sinh-12-302', 'sinh-12-303']:
        print(f"=== {c['id']}: {c['topic']} ===")
        print(c['content'])
        print("-" * 50)

