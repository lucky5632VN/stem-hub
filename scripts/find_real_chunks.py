import json

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

for c in corpus:
    top = c['topic']
    cnt = c['content']
    cid = c['id']
    if 'Oxyz' in top or 'Tích vô hướng và Tọa độ Vectơ' in top:
        print(f"[{cid}] {top}: {cnt}")
    if 'Hệ Tuần hoàn' in top or 'Tiêu hóa' in top:
        print(f"[{cid}] {top}: {cnt}")
    if 'Dòng điện Không đổi' in top or 'Hiện tượng Cảm ứng' in top:
        print(f"[{cid}] {top}: {cnt}")
