import os
import json
import hashlib
from datetime import datetime, timezone

DRAFT_PATH = 'reports/ablation/ablation_dataset_100.v1.4.0.DRAFT.json'
OFFICIAL_V141_PATH = 'reports/ablation/ablation_dataset_100.v1.4.1.json'
HASH_PATH = 'reports/ablation/dataset_hash.json'

now_iso = datetime.now(timezone.utc).isoformat()

# 1. Đọc nội dung bản nháp v1.4.0
with open(DRAFT_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2. Cập nhật trạng thái khóa chính thức v1.4.1
data['metadata']['name'] = "STEM HUB Ablation Stratified 100 Benchmark (v1.4.1 CHÍNH THỨC)"
data['metadata']['version'] = "1.4.1"
data['metadata']['status'] = "LOCKED_OFFICIAL_BY_USER"
data['metadata']['locked_at'] = now_iso
data['metadata']['lock_trigger'] = "khóa v1.4.1"
data['metadata']['gating_status'] = "ĐÃ_KHÓA_CHÍNH_THỨC_V141 (Tầng A: 4, Tầng B: 16, Tầng C: 4, Khái niệm: 40, OOS: 36)"
data['metadata']['corpus_freeze_statement'] = "kho không được bổ sung sau khi xem đề"
data['metadata']['note'] = (
    "Bộ dữ liệu v1.4.1 CHÍNH THỨC phân tách rõ 3 tầng dữ liệu số học chính thức: "
    "Tầng A (4 câu: kho đủ để giải), Tầng B (16 câu: chủ đề liên quan, chưa đủ để giải), Tầng C (4 câu: ngoài kho). "
    "Kho tri thức cố định, không được bổ sung sau khi xem đề. "
    "Báo cáo kết quả độc lập theo từng tầng riêng biệt, chỉ mô tả thống kê cho cỡ mẫu n nhỏ, tuyệt đối KHÔNG gộp chung thành một điểm số tổng."
)

# Ghi ra file chính thức v1.4.1
content_official = json.dumps(data, ensure_ascii=False, indent=2)

with open(OFFICIAL_V141_PATH, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content_official)

# 3. Tính hash SHA-256 chính thức
sha256 = hashlib.sha256(content_official.encode('utf-8')).hexdigest()

# 4. Cập nhật dataset_hash.json
with open(HASH_PATH, 'r', encoding='utf-8') as f:
    hash_data = json.load(f)

new_entry = {
    "version": "v1.4.1-locked",
    "status": "CHÍNH THỨC (Đã khóa v1.4.1 theo lệnh người dùng)",
    "sha256": sha256,
    "locked_at": now_iso,
    "file": OFFICIAL_V141_PATH,
    "total_cases": len(data['cases']),
    "strata_3_tiers": {
        "tang_A_kho_du_de_giai": 4,
        "tang_B_chu_de_lien_quan_chua_du_de_giai": 16,
        "tang_C_ngoai_kho": 4,
        "in_scope_concept": 40,
        "out_of_scope_concept": 36
    },
    "corpus_freeze_statement": "kho không được bổ sung sau khi xem đề",
    "notes": "Khóa chính thức bộ dữ liệu v1.4.1 phân tầng 3 mức theo chỉ thị 'khóa v1.4.1'",
    "detailed_changelog": (
        "Khóa v1.4.1: Phân tầng chính thức 3 mức đối với 24 câu số học: "
        "Tầng A (4 câu: kho đủ để giải), Tầng B (16 câu: chủ đề liên quan, chưa đủ để giải), Tầng C (4 câu: ngoài kho). "
        "Ghi nhận rõ ràng 'kho không được bổ sung sau khi xem đề'; báo cáo từng tầng riêng, chỉ mô tả cho n nhỏ."
    )
}

# Cập nhật đầu file hash cho v1.4.1
hash_data['v1_4_1_official'] = {
    "file": OFFICIAL_V141_PATH,
    "sha256": sha256,
    "locked_at": now_iso,
    "status": "LOCKED_OFFICIAL"
}

if 'changelog' not in hash_data:
    hash_data['changelog'] = []

hash_data['changelog'].insert(0, new_entry)

with open(HASH_PATH, 'w', encoding='utf-8') as f:
    json.dump(hash_data, f, ensure_ascii=False, indent=2)

print("=" * 80)
print("🔐 ĐÃ KHÓA THÀNH CÔNG BỘ DỮ LIỆU v1.4.1")
print("=" * 80)
print(f"- Tệp chính thức:    {OFFICIAL_V141_PATH}")
print(f"- Thời điểm khóa:    {now_iso}")
print(f"- Mã băm SHA-256:    {sha256}")
print(f"- Tổng số ca:        {len(data['cases'])}")
print(f"- Phân tầng v1.4.1:  Tầng A: 4 | Tầng B: 16 | Tầng C: 4 | Khái niệm: 40 | OOS: 36")
print(f"- Cam kết kho:       kho không được bổ sung sau khi xem đề")
print(f"- Ghi nhận tại:      {HASH_PATH}")
print("=" * 80)

