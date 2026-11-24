import json

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

print(f"Total chunks: {len(corpus)}")
topics = set(c.get('topic', '') for c in corpus)
print(f"Unique topics: {len(topics)}")
for t in sorted(topics):
    print(" ", t)

