import json

with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
    corpus = json.load(f)

def search_corpus(kw, subject=None):
    results = []
    for c in corpus:
        if subject and c.get('subject') != subject:
            continue
        cnt = c.get('content', '')
        top = c.get('topic', '')
        if kw.lower() in cnt.lower() or kw.lower() in top.lower():
            results.append((c['id'], top, cnt))
    return results

print("=== Search: Pin / điện cực (Hóa) ===")
res_chem = search_corpus('pin', 'hoa') + search_corpus('thế điện cực', 'hoa') + search_corpus('galvanic', 'hoa')
seen = set()
for cid, top, cnt in res_chem:
    if cid not in seen:
        seen.add(cid)
        print(f"[{cid}] {top}")
        # print snippet
        idx = cnt.lower().find('pin') if 'pin' in cnt.lower() else cnt.lower().find('điện')
        start = max(0, idx - 40)
        print("  Snippet:", cnt[start:start+120].replace('\n', ' '))

print("\n=== Search: Phóng xạ / bán rã (Lý) ===")
res_phys = search_corpus('phóng xạ', 'ly') + search_corpus('bán rã', 'ly') + search_corpus('hạt nhân', 'ly')
seen = set()
for cid, top, cnt in res_phys:
    if cid not in seen:
        seen.add(cid)
        print(f"[{cid}] {top}")
        start = max(0, cnt.lower().find('hạt nhân') - 40)
        print("  Snippet:", cnt[start:start+120].replace('\n', ' '))

print("\n=== Search: Quần thể / ô tiêu chuẩn / kích thước (Sinh) ===")
res_bio = search_corpus('quần thể', 'sinh') + search_corpus('kích thước', 'sinh') + search_corpus('mật độ', 'sinh')
seen = set()
for cid, top, cnt in res_bio:
    if cid not in seen:
        seen.add(cid)
        print(f"[{cid}] {top}")
        start = max(0, cnt.lower().find('quần thể') - 40)
        print("  Snippet:", cnt[start:start+120].replace('\n', ' '))

