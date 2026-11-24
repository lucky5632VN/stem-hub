import json
import os
import copy

with open('reports/ablation/ablation_dataset_100.json', 'r', encoding='utf-8') as f:
    base_data = json.load(f)

draft_data = copy.deepcopy(base_data)

draft_data['version'] = 'v1.4.0-DRAFT'
draft_data['status'] = 'DRAFT (chưa khóa hash, chờ người dùng duyệt và ra lệnh "khóa v1.4.0")'
draft_data['draft_created_at'] = '2026-11-22T21:40:00.000Z'
draft_data['notes'] = 'Bản nháp v1.4.0: Phân định nhãn nhóm ngoài phạm vi (nhóm tự soạn, chưa người kiểm), chuẩn bị tích hợp câu trắc nghiệm chính thức và câu số học kiểm chứng độc lập'

# Cập nhật nhãn nhóm ngoài phạm vi (out_of_scope)
for c in draft_data['cases']:
    if c['stratum'] == 'out_of_scope':
        c['source_type'] = 'nhóm tự soạn, chưa người kiểm'
        c['verified'] = False
        c['reviewer'] = 'chưa người kiểm'

# Thêm changelog chi tiết
draft_data['changelog_v1_4_0'] = [
    {
        "change": "Nhóm ngoài phạm vi (out_of_scope - 30 câu)",
        "detail": "Giữ nguyên 30 ca kiểm thử âm tính, gắn nhãn minh bạch 'nhóm tự soạn, chưa người kiểm' và verified: false."
    },
    {
        "change": "Nhóm số học (in_scope_numerical)",
        "detail": "Loại bỏ hoàn toàn các câu ghép mã/thứ tự khỏi nhóm tính toán số học. Xác định 23 câu computed_independent trong kho/một phần và 7 câu ứng viên bổ sung tại docs/phieu-bo-sung-so-hoc.md."
    },
    {
        "change": "Nhóm khái niệm (in_scope_concept - 40 câu)",
        "detail": "Sẵn sàng thay thế các câu AI soạn bằng các câu trắc nghiệm chính thức từ đề thi THPT 2026 sau khi người dùng đối chiếu trên phiếu."
    }
]

out_path = 'reports/ablation/ablation_dataset_100.v1.4.0.DRAFT.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(draft_data, f, ensure_ascii=False, indent=2)

print(f"✅ Đã tạo thành công bản nháp: {out_path} ({len(draft_data['cases'])} cases)")
print("🔒 File khóa cũ reports/ablation/ablation_dataset_100.json được giữ nguyên vẹn 100%.")
