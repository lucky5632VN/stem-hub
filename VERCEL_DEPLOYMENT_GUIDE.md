# HƯỚNG DẪN TRIỂN KHAI LÊN VERCEL & CẤU HÌNH BIẾN MÔI TRƯỜNG

Hệ thống đã được chuyển đổi hoàn toàn sang **Next.js API Routes** tích hợp **Firebase Admin SDK**. Bạn chỉ cần làm theo các bước dưới đây để triển khai lên Vercel (miễn phí, không yêu cầu thẻ tín dụng).

---

## BƯỚC 1: LẤY FILE KEY SERVICE ACCOUNT TỪ FIREBASE CONSOLE

Để Next.js API Routes có quyền ghi/đọc dữ liệu Firestore dưới quyền Admin, bạn cần tạo khóa bảo mật:
1. Truy cập **[Firebase Console](https://console.firebase.google.com/)** và chọn dự án của bạn.
2. Bấm vào biểu tượng **Răng cưa (Project Settings)** ở menu bên trái -> Chọn **Project Settings**.
3. Chuyển sang tab **Service Accounts**.
4. Bấm nút **Generate new private key** (Tạo khóa riêng tư mới) -> Xác nhận và tải tệp JSON về máy tính.

---

## BƯỚC 2: THIẾT LẬP FILE `.env.local` ĐỂ CHẠY THỬ CỤC BỘ (LOCAL DEV)

Tạo một file `.env.local` ở thư mục gốc của dự án (`e:/project/STT2026/.env.local`) và dán nội dung sau vào (thay thế các giá trị bằng thông tin từ file JSON bạn vừa tải về):

```env
# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID="stem-hub-43e96"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@stem-hub-43e96.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n"

# Cấu hình bảo mật Cron Job (Tùy chọn: Chuỗi ký tự bất kỳ để bảo vệ API dọn dẹp)
CRON_SECRET="your-random-cron-secret-key-here"
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ `FIREBASE_PRIVATE_KEY`**: 
> - Khóa riêng tư chứa nhiều dòng và ký tự xuống dòng.
> - Hãy chuyển các ký tự xuống dòng thành `\n` trên 1 dòng duy nhất.
> - Bọc khóa riêng tư trong cặp dấu ngoặc kép `""` như ví dụ trên để biến môi trường đọc chuẩn xác.

---

## BƯỚC 3: TRIỂN KHAI LÊN VERCEL (DEPLOY TO VERCEL)

### Cách 1: Sử dụng Vercel Dashboard (Khuyên dùng - Đơn giản nhất)
1. Đẩy toàn bộ mã nguồn của bạn lên một repository **GitHub** (hoặc GitLab/Bitbucket) ở chế độ Riêng tư (Private).
2. Đăng nhập vào **[Vercel](https://vercel.com/)** bằng tài khoản GitHub của bạn.
3. Bấm **Add New** -> Chọn **Project**.
4. Chọn repository chứa dự án **STEM Hub**.
5. Trong màn hình cấu hình dự án, mở rộng phần **Environment Variables** và thêm 3 biến sau:
   - `FIREBASE_PROJECT_ID` (ví dụ: `stem-hub-43e96`)
   - `FIREBASE_CLIENT_EMAIL` (ví dụ: `firebase-adminsdk-xxxx@...`)
   - `FIREBASE_PRIVATE_KEY` (Dán nguyên đoạn khóa có chứa `\n` đã bọc trong dấu nháy kép `""`).
6. Bấm **Deploy**. Vercel sẽ tự động build và cung cấp cho bạn một địa chỉ Web HTTPS công khai miễn phí!

### Cách 2: Sử dụng Vercel CLI (Gõ lệnh trong PowerShell)
1. Cài đặt Vercel CLI toàn cục (nếu chưa có):
   ```powershell
   npm install -g vercel
   ```
2. Đăng nhập Vercel:
   ```powershell
   vercel login
   ```
3. Chạy lệnh deploy:
   ```powershell
   vercel
   ```
   *( CLI sẽ hỏi bạn liên kết dự án, cứ bấm Enter chọn mặc định).*
4. Thêm các biến môi trường trên Vercel Dashboard theo link dự án được hiển thị sau khi chạy lệnh.
5. Triển khai chính thức (Production Deploy):
   ```powershell
   vercel --prod
   ```

---

## BƯỚC 4: KÍCH HOẠT CRON JOBS TRÊN VERCEL

Tệp `vercel.json` đã được cài đặt sẵn để chạy `/api/cron-cleanup` mỗi phút.
Khi bạn deploy lên Vercel thành công, Vercel sẽ tự động phát hiện cấu hình này và kích hoạt Cron Job trong tab **Settings > Cron Jobs** của dự án trên Vercel Dashboard mà bạn không cần phải làm gì thêm!
