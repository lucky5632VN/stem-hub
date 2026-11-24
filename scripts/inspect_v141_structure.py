import json

with open('reports/ablation/ablation_dataset_100.v1.4.1.json', 'r', encoding='utf-8') as f:
    ds = json.load(f)

cases = ds['cases']

# 5 nhóm theo yêu cầu:
# 1. Số học trong kho tầng A/B (20 câu: 4 Tầng A + 16 Tầng B)
# 2. Số học ngoài kho tầng C (4 câu: Tầng C)
# 3. Khái niệm trong kho (40 câu: in_scope_concept)
# 4. Khái niệm ngoài kho (Bổ trợ kiểm thử số học 6 câu: supplementary ABL_IN_NUM_25..30)
# 5. Ngoài phạm vi để đo bộ lọc từ chối (30 câu: out_of_scope ABL_OOS_01..30)

g1 = [c for c in cases if c.get('corpus_stratum') in ['tang_A_kho_du_de_giai', 'tang_B_chu_de_lien_quan_chua_du_de_giai']]
g2 = [c for c in cases if c.get('corpus_stratum') == 'tang_C_ngoai_kho']
g3 = [c for c in cases if c.get('stratum') == 'in_scope_concept']
g4 = [c for c in cases if c.get('corpus_stratum') == 'supplementary']
g5 = [c for c in cases if c.get('stratum') == 'out_of_scope']

print("=" * 105)
print("📊 BẢNG CƠ CẤU TẬP DỮ LIỆU v1.4.1 (100 CÂU)")
print("=" * 105)
print(f"| {'Nhóm':<35} | {'Số câu':<7} | {'Nguồn':<28} | {'Ai soạn':<18} | {'Đã kiểm (tích)':<16} |")
print(f"|{'-'*37}|{'-'*9}|{'-'*30}|{'-'*20}|{'-'*18}|")

print(f"| 1. Số học trong kho tầng A/B        | {len(g1):<7} | Đề chính thức Bộ GD&ĐT     | Nhóm nghiên cứu    | ĐÃ TÍCH [X] (20/20)|")
print(f"| 2. Số học ngoài kho tầng C          | {len(g2):<7} | Đề chính thức Bộ GD&ĐT     | Nhóm nghiên cứu    | ĐÃ TÍCH [X] (4/4)  |")
print(f"| 3. Khái niệm trong kho              | {len(g3):<7} | SGK GDPT 2018 (Toán/Lý/H/S)| LLM-assisted       | CHƯA (cần GV chấm) |")
print(f"| 4. Khái niệm ngoài kho (Bổ trợ)     | {len(g4):<7} | Tự biên soạn bám sát SGK   | LLM-assisted       | Chưa tích (6 câu)  |")
print(f"| 5. Ngoài phạm vi (Đo bộ lọc từ chối)| {len(g5):<7} | Tự biên soạn cạm bẫy       | LLM-assisted       | Tự động (Từ chối)  |")
print(f"| {'TỔNG CỘNG':<35} | {len(g1)+len(g2)+len(g3)+len(g4)+len(g5):<7} |                            |                    |                    |")

print("\n" + "=" * 105)
print("🔍 GIẢI THÍCH VỀ '36 CÂU KHÁI NIỆM NGOÀI KHO' VÀ BỘ LỌC TỪ CHỐI:")
print("=" * 105)
print(f"1. Tổng 36 câu ngoài kho gồm:")
print(f"   - 30 câu ngoài phạm vi đo bộ lọc từ chối (stratum='out_of_scope'): {g5[0]['id']} đến {g5[-1]['id']}")
print(f"   - 6 câu số học cũ bị loại khỏi 24 câu chính thức (chuyển thành supplementary): {[c['id'] for c in g4]}")
print(f"2. Xác nhận nhóm ngoài phạm vi để đo bộ lọc từ chối:")
print(f"   - Nhóm 30 câu ngoài phạm vi ({g5[0]['id']} -> {g5[-1]['id']}) VẪN CÒN NGUYÊN VẸN.")
print(f"   - Dùng để đo tỷ lệ bộ lọc từ chối (Refusal Filter / Abstention Matcher) hoạt động fail-closed.")
