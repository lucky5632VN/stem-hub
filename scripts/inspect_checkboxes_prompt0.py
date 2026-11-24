import re
import os
import subprocess

print("=== 1. DOCS/PHIEU-DOI-CHIEU-NGUON-CHINH-THUC.MD ===")
with open('docs/phieu-doi-chieu-nguon-chinh-thuc.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

cand_items = []
for line in lines:
    m = re.search(r'\|\s*`?(CAND_[A-Z0-9_]+)`?\s*\|', line)
    if m:
        cid = m.group(1)
        is_checked = bool(re.search(r'\[[xX]\]', line))
        cand_items.append((cid, is_checked))

print(f"Total CAND_* rows found: {len(cand_items)}")
checked_cand = [c for c in cand_items if c[1]]
print(f"Total [x]/[X]: {len(checked_cand)}/{len(cand_items)}")
for cid, chk in cand_items:
    status = "[x] ĐÃ TÍCH" if chk else "[ ] CHƯA TÍCH"
    print(f"  {cid}: {status}")

print("\n=== 2. DOCS/ABLATION-ANSWER-KEY-REVIEW.MD ===")
with open('docs/ablation-answer-key-review.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

abl_items = []
for idx, line in enumerate(lines):
    m = re.search(r'\|\s*\d+\s*\|\s*`(ABL_[A-Z0-9_]+)`\s*\|\s*`([a-z_]+)`\s*\|', line)
    if m:
        aid = m.group(1)
        stratum = m.group(2)
        is_checked = bool(re.search(r'\[[xX]\]', line))
        abl_items.append((aid, stratum, is_checked, idx + 1))

print(f"Total ABL_* rows found: {len(abl_items)}")
groups = {}
for aid, st, chk, lnum in abl_items:
    if st not in groups:
        groups[st] = {'total': 0, 'checked': 0, 'items': []}
    groups[st]['total'] += 1
    if chk:
        groups[st]['checked'] += 1
    groups[st]['items'].append((aid, chk, lnum))

for st, data in groups.items():
    print(f"  Nhóm {st}: {data['checked']}/{data['total']} dòng có dấu [x]")

print("\n--- Chi tiết từng ID trong ablation-answer-key-review.md ---")
for aid, st, chk, lnum in abl_items:
    status = "[x]" if chk else "[ ]"
    print(f"  Dòng {lnum}: {aid} ({st}) -> {status}")

# Kiểm tra git blame cho docs/ablation-answer-key-review.md
print("\n--- Git blame / status của docs/ablation-answer-key-review.md ---")
git_status = subprocess.run(["git", "status", "--porcelain", "docs/ablation-answer-key-review.md"], capture_output=True, text=True)
if "?? " in git_status.stdout:
    print("Trạng thái git: 'chưa commit' (untracked file: ?? docs/ablation-answer-key-review.md)")
    print("Nguồn gốc tạo: Toàn bộ 100 dòng tích [x] do trợ lý AI (assistant) tạo ra trong phiên làm việc trước thông qua script/edit_file, KHÔNG phải do người dùng tự thẩm định tích bằng tay.")
else:
    print(f"Git status: {git_status.stdout.strip()}")

print("\n=== 3. DOCS/PHIEU-BO-SUNG-SO-HOC.MD ===")
if os.path.exists('docs/phieu-bo-sung-so-hoc.md'):
    with open('docs/phieu-bo-sung-so-hoc.md', 'r', encoding='utf-8') as f:
        p_lines = f.readlines()
    p_checked = sum(1 for l in p_lines if re.search(r'\[[xX]\]', l))
    p_unchecked = sum(1 for l in p_lines if re.search(r'\[\s*\]', l))
    print(f"Tồn tại tệp. Số dòng [x]/[X]: {p_checked}, Số dòng [ ]: {p_unchecked}")
else:
    print("Tệp không tồn tại.")
