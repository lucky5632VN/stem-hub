import json

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    data_v141 = json.load(f)
    cases = data_v141.get('cases', [])
    meta = data_v141.get('metadata', {})

with open('reports/ablation/official_candidates.json', 'r', encoding='utf-8') as f:
    cands_raw = json.load(f)
    cands = cands_raw.get('candidates', cands_raw) if isinstance(cands_raw, dict) else cands_raw

print(f"ablation_dataset_100.v1.4.1.json metadata: {meta.get('version')} (total_cases: {len(cases)})")
print(f"official_candidates.json total candidates: {len(cands)}")

# Count tiers & categories
tiers = {}
categories = {}
for q in cases:
    t = q.get('tier', 'none')
    tiers[t] = tiers.get(t, 0) + 1
    c = q.get('category', 'none')
    categories[c] = categories.get(c, 0) + 1

print("Tiers breakdown in v1.4.1:", tiers)
print("Categories breakdown in v1.4.1:", categories)
print("Metadata groups_summary:", meta.get('groups_summary'))

# 24 numerical questions
num_questions = [q for q in cases if 'NUM' in q.get('id', '') or q.get('category') == 'in_scope_numerical']
print(f"Numerical questions found: {len(num_questions)}")

cands_by_id = {c.get('id'): c for c in cands}
cands_by_query = {c.get('question', '').strip().lower(): c for c in cands}

matched = 0
mismatches = []

print("\n--- 24 NUMERICAL QUESTIONS TABLE ---")
header = f"| {'ABL_ID':<15} | {'CAND_ID':<15} | {'Subj':<5} | {'Tier':<4} | {'Corpus':<8} | {'Match':<12} | {'Question (first 55 chars)':<57} | {'Answer':<20} |"
print(header)
print("|" + "-"*17 + "|" + "-"*17 + "|" + "-"*7 + "|" + "-"*6 + "|" + "-"*10 + "|" + "-"*14 + "|" + "-"*59 + "|" + "-"*22 + "|")

for q in num_questions:
    abl_id = q.get('id', '')
    cand_id = q.get('candidate_id') or q.get('official_id') or q.get('candidateId') or q.get('candidateIdMatch') or q.get('cand_id') or 'N/A'
    subj = q.get('subject', '')
    tier = q.get('tier', '')
    corpus_label = q.get('corpus_label') or q.get('in_corpus') or q.get('corpusStatus') or q.get('corpus_status') or 'N/A'
    text = q.get('question', '').strip()
    ans = q.get('expected_answer') or q.get('ground_truth') or q.get('answer') or q.get('target_answer') or 'N/A'
    ans_str = str(ans)[:18]
    text_short = text[:55]

    is_match = "NOT_FOUND"
    matched_c_id = "N/A"
    if cand_id in cands_by_id:
        c_text = cands_by_id[cand_id].get('question', '').strip()
        matched_c_id = cand_id
        if c_text.lower() == text.lower():
            is_match = "EXACT"
            matched += 1
        elif text.lower() in c_text.lower() or c_text.lower() in text.lower():
            is_match = "PARTIAL"
            matched += 1
        else:
            is_match = "DIFF_TEXT"
            mismatches.append({
                'abl_id': abl_id, 'cand_id': cand_id, 'abl_text': text, 'cand_text': c_text
            })
    else:
        # Check by query text in cands
        found = None
        for cid, c in cands_by_id.items():
            cq = c.get('question', '').strip().lower()
            if cq == text.lower() or (len(text) > 20 and text[:30].lower() in cq):
                found = c
                break
        if found:
            is_match = f"BY_TXT({found.get('id')})"
            matched_c_id = found.get('id')
            matched += 1
        else:
            mismatches.append({
                'abl_id': abl_id, 'cand_id': cand_id, 'abl_text': text, 'cand_text': 'NOT IN OFFICIAL_CANDIDATES'
            })

    print(f"| {abl_id:<15} | {matched_c_id:<15} | {subj:<5} | {tier:<4} | {str(corpus_label):<8} | {is_match:<12} | {text_short:<57} | {ans_str:<20} |")

print(f"\nSummary: matched={matched}/24, mismatches={len(mismatches)}")
if mismatches:
    print("\nDetails of mismatches:")
    for m in mismatches:
        print(f"  {m['abl_id']} (cand={m['cand_id']}):")
        print(f"    ABL:  {m['abl_text'][:100]}")
        print(f"    CAND: {m['cand_text'][:100]}")
