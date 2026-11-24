import json
import re
import subprocess
import os

# --- MỤC 0: KIỂM KÊ DẤU TÍCH THEO TỪNG ID ---
print("=== MỤC 0: KIỂM KÊ DẤU TÍCH THEO PROMPT V MỤC 1-3 ===")

# 1. docs/phieu-doi-chieu-nguon-chinh-thuc.md
phieu_chinh_thuc = "docs/phieu-doi-chieu-nguon-chinh-thuc.md"
with open(phieu_chinh_thuc, "r", encoding="utf-8") as f:
    pt_lines = f.readlines()

cand_ticks = []
for line in pt_lines:
    if "CAND_" in line:
        m_id = re.search(r"`(CAND_[A-Z0-9_]+)`", line)
        cand_id = m_id.group(1) if m_id else "UNKNOWN"
        is_ticked = bool(re.search(r"\[[xX]\]", line))
        cand_ticks.append((cand_id, is_ticked, line.strip()))

print(f"1.1. {phieu_chinh_thuc}:")
print(f"  Tổng số dòng CAND_*: {len(cand_ticks)}")
print(f"  Số dòng đã tích [x]/[X]: {sum(1 for _, t, _ in cand_ticks if t)}")
print(f"  Số dòng chưa tích [ ]: {sum(1 for _, t, _ in cand_ticks if not t)}")
for cid, t, _ in cand_ticks:
    print(f"    {cid}: {'[x]' if t else '[ ]'}")

# 2. docs/ablation-answer-key-review.md
phieu_review = "docs/ablation-answer-key-review.md"
with open(phieu_review, "r", encoding="utf-8") as f:
    ak_lines = f.readlines()

abl_ticks = []
for line in ak_lines:
    if "ABL_" in line:
        m_id = re.search(r"`(ABL_[A-Z0-9_]+)`", line)
        abl_id = m_id.group(1) if m_id else "UNKNOWN"
        is_ticked = bool(re.search(r"\[[xX]\]", line))
        m_group = re.search(r"`(in_scope_concept|in_scope_numerical|out_of_scope)`", line)
        group = m_group.group(1) if m_group else "UNKNOWN"
        abl_ticks.append((abl_id, group, is_ticked, line.strip()))

print(f"\n1.2. {phieu_review}:")
print(f"  Tổng số dòng ABL_*: {len(abl_ticks)}")
print(f"  Số dòng đã tích [x]/[X]: {sum(1 for _, _, t, _ in abl_ticks if t)}")
by_group = {}
for aid, grp, t, _ in abl_ticks:
    by_group.setdefault(grp, []).append((aid, t))

for grp, items in by_group.items():
    print(f"  - Nhóm {grp}: {len(items)} câu (đã tích: {sum(1 for _, t in items if t)})")

# 3. docs/phieu-bo-sung-so-hoc.md
phieu_bo_sung = "docs/phieu-bo-sung-so-hoc.md"
if os.path.exists(phieu_bo_sung):
    with open(phieu_bo_sung, "r", encoding="utf-8") as f:
        bs_lines = f.readlines()
    bs_ticks = []
    for line in bs_lines:
        if "SUPP_" in line:
            m_id = re.search(r"`(SUPP_[A-Z0-9_]+)`", line)
            sid = m_id.group(1) if m_id else "UNKNOWN"
            is_ticked = bool(re.search(r"\[[xX]\]", line))
            bs_ticks.append((sid, is_ticked))
    print(f"\n1.3. {phieu_bo_sung}:")
    print(f"  Tổng số dòng SUPP_*: {len(bs_ticks)}")
    print(f"  Số dòng đã tích [x]/[X]: {sum(1 for _, t in bs_ticks if t)}")
    for sid, t in bs_ticks:
        print(f"    {sid}: {'[x]' if t else '[ ]'}")
else:
    print(f"\n1.3. {phieu_bo_sung}: Không tồn tại")

# Git blame on ablation-answer-key-review.md
print(f"\n1.4. Git blame kiểm tra tác giả các dòng tích trong {phieu_review}:")
try:
    res = subprocess.run(
        ["git", "blame", "-L", "15,25", phieu_review],
        capture_output=True, text=True, check=True
    )
    print("  Mẫu git blame dòng 15-25:")
    print(res.stdout)
except Exception as e:
    print("  Git blame lỗi:", e)

