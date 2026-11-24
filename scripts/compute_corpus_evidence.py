import json
import re

def compute_corpus_evidence():
    with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
        corpus = json.load(f)

    with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
        cands = json.load(f)

    def tokenize(text):
        return set(re.findall(r'\w+', text.lower()))

    corpus_tokens = [tokenize(c.get('subject', '') + ' ' + c.get('topic', '') + ' ' + c.get('content', '')) for c in corpus]

    results = {}
    for cand in cands:
        cid = cand['id']
        sub = cand['subject']
        q_tokens = tokenize(cand['question_text'] + ' ' + cand.get('topic_name', '') + ' ' + sub)
        
        scores = []
        for idx, ctok in enumerate(corpus_tokens):
            common = len(q_tokens.intersection(ctok))
            # Boost same subject
            if corpus[idx].get('subject', '') == sub:
                common += 5
            scores.append((common, idx))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        top5 = scores[:5]
        
        top5_info = []
        for score, idx in top5:
            ch = corpus[idx]
            top5_info.append({
                'chunk_id': ch['id'],
                'topic': ch.get('topic', ''),
                'score': score,
                'content': ch.get('content', '')
            })
            
        results[cid] = top5_info

    return results

if __name__ == '__main__':
    res = compute_corpus_evidence()
    print(f"Computed corpus evidence for {len(res)} candidates.")
    # Show first 3
    for cid in list(res.keys())[:3]:
        print(f"\n--- {cid} ---")
        for c in res[cid]:
            print(f"[{c['score']}] {c['chunk_id']}: {c['topic']}")
            print(f"   Excerpt: {c['content'][:100]}...")

