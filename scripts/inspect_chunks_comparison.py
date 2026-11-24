import json

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

cmap = {c['id']: c for c in corpus}

target_chunks = ['hoa-12-067', 'hoa-12-082', 'ly-12-161', 'ly-12-166', 'sinh-12-286', 'sinh-12-301']
for cid in target_chunks:
    if cid in cmap:
        c = cmap[cid]
        topic = c.get('topic', '')
        subj = c.get('subject', '')
        content = c.get('content', '')
        print(f"=== {cid}: {topic} ({subj}) ===")
        print(content[:350].strip())
        print("-" * 60)
    else:
        print(f"=== {cid}: NOT FOUND ===")

