import json
import re

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

print(f"Loaded {len(corpus)} chunks.")

# Simple BM25 / token matching
def tokenize(text):
    text = text.lower()
    return set(re.findall(r'\w+', text))

corpus_tokens = []
for c in corpus:
    tokens = tokenize(c.get('topic', '') + ' ' + c.get('content', ''))
    corpus_tokens.append(tokens)

def retrieve_top5(query):
    q_tokens = tokenize(query)
    scores = []
    for i, tokens in enumerate(corpus_tokens):
        common = len(q_tokens.intersection(tokens))
        scores.append((common, i))
    scores.sort(key=lambda x: x[0], reverse=True)
    top5 = scores[:5]
    return [(corpus[idx]['id'], corpus[idx]['topic'], score) for score, idx in top5]

# Test a few sample queries
test_queries = [
    ("Toán tích phân diện tích thể tích khối tròn xoay", "Ứng dụng Tích phân"),
    ("Hoá học pin Galvani sức điện động thế điện cực", "Pin Galvani"),
    ("Vật lý chất khí nhiệt độ áp suất lốp xe đẳng tích", "Khí lí tưởng"),
    ("Sinh học kích thước quần thể phương pháp ô nghiên cứu", "Quần thể sinh vật")
]

for q, desc in test_queries:
    print(f"\nQuery: {desc}")
    top = retrieve_top5(q)
    for cid, topic, score in top:
        print(f"  [{score}] {cid}: {topic}")

