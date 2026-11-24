import json
import re

def run_corpus_analysis():
    with open('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'r', encoding='utf-8') as f:
        corpus = json.load(f)

    with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
        cands = json.load(f)

    def tokenize(text):
        return set(re.findall(r'\w+', text.lower()))

    corpus_map = {c['id']: c for c in corpus}
    corpus_tokens = [(c['id'], tokenize(c.get('subject', '') + ' ' + c.get('topic', '') + ' ' + c.get('content', '')), c.get('subject', '')) for c in corpus]

    results = []

    for c in cands:
        cid = c['id']
        sub = c['subject']
        q_tokens = tokenize(c['question_text'] + ' ' + c.get('topic_name', '') + ' ' + sub)
        
        scores = []
        for ch_id, ctok, ch_sub in corpus_tokens:
            common = len(q_tokens.intersection(ctok))
            if ch_sub == sub:
                common += 5
            scores.append((common, ch_id))
            
        scores.sort(key=lambda x: x[0], reverse=True)
        top5 = scores[:5]
        
        # Determine coverage label and quote
        # Let's inspect topic and content
        top_chunk_id = top5[0][1]
        top_chunk = corpus_map[top_chunk_id]
        
        results.append({
            'id': cid,
            'subject': sub,
            'question_part': c['question_part'],
            'question_number': c['question_number'],
            'top5': [x[1] for x in top5],
            'top1_chunk': top_chunk_id,
            'top1_topic': top_chunk.get('topic', ''),
            'top1_content': top_chunk.get('content', '')
        })

    with open('reports/ablation/corpus_raw_retrieval.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Saved corpus_raw_retrieval.json")

if __name__ == '__main__':
    run_corpus_analysis()

