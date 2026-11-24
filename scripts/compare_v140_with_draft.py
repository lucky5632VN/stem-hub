import json

with open('reports/ablation/ablation_dataset_100.v1.4.0.json', 'r', encoding='utf-8') as f:
    v140 = json.load(f)

with open('reports/ablation/ablation_dataset_100.v1.4.0.DRAFT.json', 'r', encoding='utf-8') as f:
    draft = json.load(f)

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    v141 = json.load(f)

print("=" * 80)
print("📊 SO SÁNH CÁC TRƯỜNG PHÂN TẦNG: v1.4.0 (ĐÃ KHÓA) vs DRAFT vs v1.4.1")
print("=" * 80)

print("\n1. CẤU TRÚC PHÂN TẦNG TRONG METADATA:")
print("--- v1.4.0 (Đã khóa):")
print(json.dumps(v140['metadata'].get('groups_summary', {}), ensure_ascii=False, indent=2))
print("\n--- DRAFT / v1.4.1 (Đã chuẩn hóa 3 tầng A/B/C):")
print(json.dumps(draft['metadata'].get('groups_summary', {}), ensure_ascii=False, indent=2))

print("\n2. CHI TIẾT THAY ĐỔI NHÃN TRÊN 24 CÂU SỐ HỌC ỨNG VIÊN:")
print("| ID | Trường | v1.4.0 (Đã khóa) | DRAFT / v1.4.1 (Chuẩn 3 tầng) |")
print("|---|---|---|---|")

diff_count = 0
for c_v140, c_v141 in zip(v140['cases'], v141['cases']):
    cid = c_v140['id']
    if 'ABL_IN_NUM_' in cid:
        g_old = c_v140.get('dataset_v140_group', 'N/A')
        g_new = c_v141.get('corpus_stratum', 'N/A')
        lbl_old = c_v140.get('corpus_label', 'chưa có')
        lbl_new = c_v141.get('corpus_label', 'N/A')
        
        if g_old != g_new or lbl_old != lbl_new:
            diff_count += 1
            print(f"| `{cid}` | `corpus_stratum` / `group` | `{g_old}` | `{g_new}` ({lbl_new}) |")

print(f"\nTổng số câu có cập nhật cấu trúc phân tầng: {diff_count} câu.")

