import os
import json
import hashlib
from datetime import datetime, timezone

DRAFT_PATH = 'reports/ablation/ablation_dataset_100.v1.4.0.DRAFT.json'
OFFICIAL_V140_PATH = 'reports/ablation/ablation_dataset_100.v1.4.0.json'
HASH_PATH = 'reports/ablation/dataset_hash.json'

now_iso = datetime.now(timezone.utc).isoformat()

# 1. Đọc nội dung bản nháp
with open(DRAFT_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2. Cập nhật trạng thái khóa chính thức
data['metadata']['name'] = "STEM HUB Ablation Stratified 100 Benchmark (v1.4.0 CHÍNH THỨC)"
data['metadata']['version'] = "1.4.0"
data['metadata']['status'] = "LOCKED_OFFICIAL_BY_USER"
data['metadata']['locked_at'] = now_iso
data['metadata']['lock_trigger'] = "khóa v1.4.0"
data['metadata']['gating_status'] = "ĐÃ_KHÓA_CHÍNH_THỨC (N=20 số học trong kho, N=4 số học ngoài kho)"

# Ghi ra file chính thức v1.4.0 và cập nhật lại DRAFT
content_official = json.dumps(data, ensure_ascii=False, indent=2)

with open(OFFICIAL_V140_PATH, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content_official)

with open(DRAFT_PATH, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content_official)

# 3. Tính hash SHA-256 chính thức
sha256 = hashlib.sha256(content_official.encode('utf-8')).hexdigest()

# 4. Cập nhật dataset_hash.json
with open(HASH_PATH, 'r', encoding='utf-8') as f:
    hash_data = json.load(f)

new_entry = {
    "version": "v1.4.0-locked",
    "status": "CHÍNH THỨC (Đã khóa v1.4.0 theo lệnh người dùng)",
    "sha256": sha256,
    "locked_at": now_iso,
    "file": OFFICIAL_V140_PATH,
    "total_cases": len(data['cases']),
    "strata_v140": {
        "main_in_scope_numerical": 20,
        "out_of_scope_numerical": 4,
        "in_scope_concept": 40,
        "out_of_scope_concept": 36
    },
    "notes": "Khóa chính thức bộ dữ liệu v1.4.0 phân tầng độc lập theo chỉ thị 'khóa v1.4.0'",
    "detailed_changelog": "Phân tách rõ ràng: 20 câu số học trong kho (12 đủ giải + 8 kiến thức nền) và 4 câu số học ngoài kho (CAND_MATH_02, CAND_CHEM_01, CAND_PHYS_03, CAND_PHYS_04); báo cáo độc lập từng nhóm, không gộp chung điểm số."
}

# Cập nhật đầu file hash
hash_data['v1_4_0_official'] = {
    "file": OFFICIAL_V140_PATH,
    "sha256": sha256,
    "locked_at": now_iso,
    "status": "LOCKED_OFFICIAL"
}

if 'changelog' not in hash_data:
    hash_data['changelog'] = []

hash_data['changelog'].insert(0, new_entry)

with open(HASH_PATH, 'w', encoding='utf-8') as f:
    json.dump(hash_data, f, ensure_ascii=False, indent=2)

print("========================================================================")
print("🔐 ĐÃ KHÓA THÀNH CÔNG BỘ DỮ LIỆU v1.4.0")
print("========================================================================")
print(f"- Tệp chính thức:  {OFFICIAL_V140_PATH}")
print(f"- Tệp DRAFT đồng bộ: {DRAFT_PATH}")
print(f"- Thời điểm khóa:  {now_iso}")
print(f"- Mã băm SHA-256:  {sha256}")
print(f"- Tổng số ca:      {len(data['cases'])}")
print(f"- Phân tầng v1.4.0: 20 trong kho + 4 ngoài kho + 40 khái niệm + 36 OOS")
print(f"- Ghi nhận tại:    {HASH_PATH}")
print("========================================================================")
