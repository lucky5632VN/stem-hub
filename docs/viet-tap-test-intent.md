# 📝 HƯỚNG DẪN VIẾT BỘ TEST Ý ĐỊNH ĐỘC LẬP (INTENT CLASSIFIER TEST SET)
**Mục tiêu**: Xây dựng 30 câu test hoàn toàn độc lập với dữ liệu huấn luyện (zero data leakage, không chung template) để thẩm định khách quan mô hình Naive Bayes vs Hệ luật.

---

## 1. Danh Sách 7 Lớp Ý Định Chuẩn (7 Intent Classes)
Mỗi câu hỏi cần được gắn nhãn chính xác 1 trong 7 lớp sau:

1. `stem_query`: Câu hỏi chuyên môn STEM (Toán, Lý, Hóa, Sinh), yêu cầu giải bài, giải thích công thức, hiện tượng.
   - *Ví dụ*: "cách giải pt bậc 2 có nghiệm kép", "cho tui hỏi este no đơn chức mạch hở có CTPT là gì".
2. `nav_phongthi`: Ý định vào phòng thi, làm bài kiểm tra trắc nghiệm, thi thử.
   - *Ví dụ*: "cho tui dô phòng thi 15 phút môn toán", "muốn làm đề thi thử thpt quốc gia".
3. `nav_dautruong`: Ý định vào đấu trường đối kháng 1v1 PvP, khiêu chiến.
   - *Ví dụ*: "muốn solo pvp với bạn", "vào sảnh đấu trường tìm đối thủ".
4. `nav_hoso`: Ý định xem trang cá nhân, hồ sơ, thành tích, đổi avatar, trang bị.
   - *Ví dụ*: "mở trang cá nhân của tui coi", "xem lại elo và cấp độ của mình".
5. `nav_story`: Ý định xem hành trình cốt truyện, nhiệm vụ theo cốt truyện STEM.
   - *Ví dụ*: "xem phần cốt truyện khám phá vũ trụ", "tiếp tục chương 2 câu chuyện stem".
6. `toggle_theme`: Ý định bật/tắt giao diện sáng/tối (Dark/Light mode).
   - *Ví dụ*: "chuyển sang nền tối giùm tui", "bật dark mode cho đỡ chói mắt".
7. `chitchat`: Xã giao, chào hỏi, hỏi về AI, hỏi thăm hoặc câu không thuộc 6 nhóm trên.
   - *Ví dụ*: "hôm nay cậu có mệt không", "ai chế tạo ra bạn vậy".

---

## 2. Quy Tắc Viết Bộ Test Mới Độc Lập
1. **Không sao chép từ ngữ từ tập huấn luyện**: Viết theo phong cách tự nhiên, ngôn ngữ đời thường, tiếng lóng học sinh mới (Gen Z/Alpha), lỗi chính tả tự nhiên.
2. **Cân đối số lượng**: Mỗi ý định có từ 4 đến 5 câu (tổng cộng 30 câu).
3. **Độ khó đa dạng**: Bao gồm câu ngắn (dưới 5 từ), câu dài (trên 15 từ) và câu có từ khóa gây nhiễu (chứa từ "chơi" nhưng là xã giao, chứa từ "toán" nhưng là thi thử).

---

## 3. Mẫu Khung JSON Nạp Dữ Liệu (Template)
Lưu file vào đường dẫn `data/test/intent_independent_30.json`:

```json
[
  {
    "id": "intent_new_01",
    "text": "Alo bot ơi tính giùm tui tích phân từ 0 tới 1 của x^2 dx",
    "intent": "stem_query",
    "author": "Giáo viên / Thẩm định viên"
  },
  {
    "id": "intent_new_02",
    "text": "Bữa nay chán quá dô làm vài ván solo thách đấu xem ai vip hơn",
    "intent": "nav_dautruong",
    "author": "Giáo viên / Thẩm định viên"
  }
]
```

---

## 4. Cơ Chế Khóa Hash Sau Khi Nhập Liệu
Chạy script để kiểm tra tính toàn vẹn và tạo chữ ký hash SHA-256 khóa dữ liệu:

```powershell
node scripts/lock_answer_key.mjs --target=intent --file=data/test/intent_independent_30.json
```

Khi file JSON được khóa hash, script benchmark sẽ đối chiếu hash SHA-256 trước khi chạy và in rõ trong báo cáo:
- Tên người thẩm định / giáo viên biên soạn
- Mã hash SHA-256
- Tỉ lệ $k/n$, Wilson 95% CI và kết quả kiểm định McNemar chính xác với $df=1$.

