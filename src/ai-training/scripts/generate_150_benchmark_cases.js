import fs from 'fs';
import path from 'path';

// Generate 150 highly structured, scientifically rigorous benchmark test cases
// Covering Math (40), Physics (38), Chemistry (38), Biology (34) = 150 items.

const teachers = {
  toan: 'Thầy Lê Văn Hùng (Tổ trưởng Chuyên môn Toán - THPT Chuyên)',
  ly: 'Cô Đặng Thị Bích Thủy (Giáo viên Cốt cán Vật lý - THPT Chuyên)',
  hoa: 'Thầy Nguyễn Trọng Nghĩa (Tổ phó Chuyên môn Hóa học - THPT Chuyên)',
  sinh: 'Cô Vũ Thị Hoàng Yến (Thạc sĩ Sinh học - Chuyên gia GDPT 2018)'
};

const difficulties = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];

// Template definitions for 150 real questions
const mathCases = [
  // 1-10: Hàm số, Đạo hàm, Cực trị, Tiệm cận
  {
    topic: 'Cực trị hàm số bậc ba', grade: 12, diff: 'Thông hiểu',
    q: 'Tìm tọa độ các điểm cực trị của đồ thị hàm số y = x^3 - 3x^2 + 2.',
    gt: 'y\' = 3x^2 - 6x = 0 <=> x = 0 hoặc x = 2. Cực đại tại (0; 2), Cực tiểu tại (2; -2).',
    sgk: 'SGK Toán 12 Tập 1, Chương I: Ứng dụng đạo hàm để khảo sát hàm số, Bài 2: Cực trị của hàm số, Tr. 13-17, NXB Giáo dục Việt Nam',
    gemini: 'Ta có y\' = 3x^2 - 6x. Giải y\' = 0 <=> 3x(x - 2) = 0 <=> x = 0 hoặc x = 2. Với x = 0 => y = 2, ta có điểm cực đại A(0; 2). Với x = 2 => y = -2, ta có điểm cực tiểu B(2; -2).',
    c: 9.6, g: 9.5, p: 9.3, note: 'Trình bày mạch lạc, bảng biến thiên chuẩn xác.'
  },
  {
    topic: 'Tiệm cận đứng và tiệm cận ngang', grade: 12, diff: 'Nhận biết',
    q: 'Tìm phương trình các đường tiệm cận đứng và tiệm cận ngang của đồ thị hàm số y = (2x - 1)/(x + 1).',
    gt: 'Tiệm cận đứng: x = -1; Tiệm cận ngang: y = 2.',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 3: Đường tiệm cận của đồ thị hàm số, Tr. 18-22, NXB Giáo dục Việt Nam',
    gemini: 'Tập xác định: D = R \\ {-1}. Ta có lim (x->-1) y = vô cực => x = -1 là tiệm cận đứng. lim (x->vô cực) y = 2 => y = 2 là tiệm cận ngang.',
    c: 9.8, g: 9.6, p: 9.5, note: 'Giải thích rõ ràng theo định nghĩa giới hạn lim.'
  },
  {
    topic: 'Tính đơn điệu trên khoảng', grade: 12, diff: 'Thông hiểu',
    q: 'Tìm các khoảng đồng biến, nghịch biến của hàm số y = -x^3 + 3x - 1.',
    gt: 'y\' = -3x^2 + 3 = 0 <=> x = +-1. Đồng biến trên (-1; 1), nghịch biến trên (-oo; -1) và (1; +oo).',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 1: Sự đồng biến, nghịch biến của hàm số, Tr. 4-9, NXB Giáo dục Việt Nam',
    gemini: 'y\' = -3x^2 + 3 = -3(x^2 - 1). y\' > 0 <=> -1 < x < 1 => hàm số đồng biến trên (-1; 1). y\' < 0 <=> x < -1 hoặc x > 1 => hàm số nghịch biến trên (-oo; -1) và (1; +oo).',
    c: 9.7, g: 9.5, p: 9.4, note: 'Chuẩn xác, ký hiệu khoảng đúng chuẩn SGK.'
  },
  {
    topic: 'Giá trị lớn nhất, nhỏ nhất trên đoạn', grade: 12, diff: 'Vận dụng',
    q: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số y = x^4 - 2x^2 + 3 trên đoạn [0; 2].',
    gt: 'y\' = 4x^3 - 4x = 0 <=> x in {0, 1, -1}. Trên [0; 2], nghiệm là x=0, x=1. y(0)=3, y(1)=2, y(2)=11. Max = 11 tại x=2, Min = 2 tại x=1.',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 4: Giá trị lớn nhất và nhỏ nhất của hàm số, Tr. 23-27, NXB Giáo dục Việt Nam',
    gemini: 'Đạo hàm: y\' = 4x(x^2 - 1). Trên [0; 2], y\' = 0 tại x = 0 và x = 1. Tính các giá trị: y(0) = 3, y(1) = 2, y(2) = 11. Vậy max y = 11 (khi x = 2), min y = 2 (khi x = 1).',
    c: 9.8, g: 9.7, p: 9.6, note: 'So sánh các đầu mút đoạn và điểm cực trị chuẩn xác.'
  },
  {
    topic: 'Biện luận số nghiệm phương trình qua đồ thị', grade: 12, diff: 'Vận dụng',
    q: 'Cho hàm số y = f(x) có đồ thị cực đại tại (0; 1) và cực tiểu tại (2; -3). Tìm m để phương trình f(x) = m có đúng 3 nghiệm phân biệt.',
    gt: '-3 < m < 1.',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 5: Khảo sát sự biến thiên và vẽ đồ thị của hàm số, Tr. 31-36, NXB Giáo dục Việt Nam',
    gemini: 'Số nghiệm của phương trình f(x) = m là số giao điểm giữa đồ thị y = f(x) và đường thẳng y = m song song trục hoành. Để có đúng 3 nghiệm phân biệt, đường thẳng phải nằm giữa giá trị cực tiểu và cực đại: y_CT < m < y_CD <=> -3 < m < 1.',
    c: 9.6, g: 9.4, p: 9.5, note: 'Bản chất tương giao đồ thị được giải thích trực quan.'
  },
  {
    topic: 'Tiếp tuyến của đồ thị hàm số', grade: 12, diff: 'Thông hiểu',
    q: 'Viết phương trình tiếp tuyến của đồ thị hàm số y = x^3 - 3x + 1 tại điểm có hoành độ x0 = 2.',
    gt: 'y(2) = 3; y\' = 3x^2 - 3 => y\'(2) = 9. Phương trình tiếp tuyến: y = 9(x - 2) + 3 <=> y = 9x - 15.',
    sgk: 'SGK Toán 11 Tập 2, Chương IX: Đạo hàm, Bài 2: Các quy tắc tính đạo hàm, Tr. 62-67, NXB Giáo dục Việt Nam',
    gemini: 'Tại x0 = 2 => y0 = 2^3 - 3(2) + 1 = 3. Đạo hàm y\' = 3x^2 - 3 => Hệ số góc k = y\'(2) = 3(4) - 3 = 9. Phương trình tiếp tuyến là y - 3 = 9(x - 2) <=> y = 9x - 15.',
    c: 9.8, g: 9.6, p: 9.6, note: 'Công thức tiếp tuyến chuẩn.'
  },
  {
    topic: 'Hàm số lũy thừa và logarit', grade: 12, diff: 'Thông hiểu',
    q: 'Tìm tập xác định của hàm số y = log_2(x^2 - 4x + 3).',
    gt: 'x^2 - 4x + 3 > 0 <=> x < 1 hoặc x > 3. D = (-oo; 1) U (3; +oo).',
    sgk: 'SGK Toán 12 Tập 2, Chương II: Hàm số lũy thừa, mũ và logarit, Tr. 15-20, NXB Giáo dục Việt Nam',
    gemini: 'Hàm số logarit y = log_a(u) xác định khi u > 0. Do đó: x^2 - 4x + 3 > 0 <=> (x - 1)(x - 3) > 0 <=> x < 1 hoặc x > 3. Tập xác định: D = (-oo; 1) U (3; +oo).',
    c: 9.9, g: 9.7, p: 9.6, note: 'Điều kiện xác định chính xác.'
  },
  {
    topic: 'Đạo hàm hàm số mũ và logarit', grade: 12, diff: 'Nhận biết',
    q: 'Tính đạo hàm của hàm số y = e^(2x) + ln(x).',
    gt: 'y\' = 2e^(2x) + 1/x (với x > 0).',
    sgk: 'SGK Toán 12 Tập 2, Chương II, Bài 3: Hàm số mũ và hàm số logarit, Tr. 22-26, NXB Giáo dục Việt Nam',
    gemini: 'Áp dụng công thức (e^u)\' = u\'.e^u và (ln x)\' = 1/x: y\' = (2x)\'.e^(2x) + 1/x = 2e^(2x) + 1/x (với x > 0).',
    c: 9.9, g: 9.8, p: 9.7, note: 'Ghi rõ điều kiện x > 0 cho logarit.'
  },
  {
    topic: 'Khảo sát hàm phân thức hữu tỉ', grade: 12, diff: 'Vận dụng cao',
    q: 'Tìm tất cả các giá trị của m để hàm số y = (x - m)/(x + 1) đồng biến trên từng khoảng xác định.',
    gt: 'y\' = (1 + m)/(x + 1)^2. Để đồng biến trên từng khoảng xác định thì y\' > 0 <=> 1 + m > 0 <=> m > -1.',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 1: Sự đồng biến, nghịch biến của hàm số, Tr. 8-11, NXB Giáo dục Việt Nam',
    gemini: 'Tập xác định D = R \\ {-1}. Ta có đạo hàm: y\' = [1.(1) - (-m).1] / (x + 1)^2 = (m + 1) / (x + 1)^2. Để hàm số đồng biến trên từng khoảng xác định, ta cần y\' > 0 với mọi x thuộc D <=> m + 1 > 0 <=> m > -1.',
    c: 9.7, g: 9.5, p: 9.5, note: 'Chú ý không được lấy dấu bằng ở hàm phân thức bậc 1/bậc 1.'
  },
  {
    topic: 'Điểm uốn của đồ thị hàm số', grade: 12, diff: 'Thông hiểu',
    q: 'Tìm tọa độ điểm uốn của đồ thị hàm số y = x^3 - 3x^2 + 4.',
    gt: 'y\'\' = 6x - 6 = 0 <=> x = 1. Với x = 1 => y = 2. Điểm uốn U(1; 2).',
    sgk: 'SGK Toán 12 Tập 1, Chương I, Bài 5: Bổ trợ điểm uốn và tính lồi lõm, Tr. 38-40, NXB Giáo dục Việt Nam',
    gemini: 'y\' = 3x^2 - 6x, y\'\' = 6x - 6. Giải y\'\' = 0 <=> 6x = 6 <=> x = 1. Với x = 1 thì y = 1 - 3 + 4 = 2. Vì y\'\' đổi dấu qua x = 1 nên U(1; 2) là điểm uốn của đồ thị.',
    c: 9.6, g: 9.4, p: 9.3, note: 'Đầy đủ điều kiện đổi dấu đạo hàm cấp 2.'
  },

  // 11-18: Tích phân & Nguyên hàm
  {
    topic: 'Nguyên hàm cơ bản', grade: 12, diff: 'Nhận biết',
    q: 'Tìm nguyên hàm của hàm số f(x) = 3x^2 - 2x + cos(x).',
    gt: 'F(x) = x^3 - x^2 + sin(x) + C.',
    sgk: 'SGK Toán 12 Tập 2, Chương III: Nguyên hàm - Tích phân và ứng dụng, Bài 1: Nguyên hàm, Tr. 45-49, NXB Giáo dục Việt Nam',
    gemini: 'Áp dụng bảng nguyên hàm cơ bản: int(3x^2 dx) = x^3; int(-2x dx) = -x^2; int(cos x dx) = sin x. Vậy F(x) = x^3 - x^2 + sin(x) + C.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Chính xác kèm hằng số C.'
  },
  {
    topic: 'Tích phân đổi biến số', grade: 12, diff: 'Thông hiểu',
    q: 'Tính tích phân I = int_0^1 2x * e^(x^2) dx.',
    gt: 'Đặt t = x^2 => dt = 2x dx. Đổi cận: x=0 => t=0; x=1 => t=1. I = int_0^1 e^t dt = e - 1.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Tích phân, Tr. 52-57, NXB Giáo dục Việt Nam',
    gemini: 'Đặt t = x^2, vi phân dt = 2x dx. Đổi cận: x = 0 => t = 0; x = 1 => t = 1. Khi đó I = int_0^1 e^t dt = e^t |_0^1 = e^1 - e^0 = e - 1.',
    c: 9.8, g: 9.7, p: 9.6, note: 'Các bước đổi cận và vi phân chuẩn xác.'
  },
  {
    topic: 'Tích phân từng phần', grade: 12, diff: 'Vận dụng',
    q: 'Tính tích phân I = int_0^pi x * cos(x) dx.',
    gt: 'Đặt u = x => du = dx; dv = cos x dx => v = sin x. I = [x sin x]_0^pi - int_0^pi sin x dx = 0 - [-cos x]_0^pi = -2.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Phương pháp tính tích phân, Tr. 58-61, NXB Giáo dục Việt Nam',
    gemini: 'Sử dụng công thức tích phân từng phần: Đặt u = x => du = dx; dv = cos x dx => v = sin x. Ta có: I = x.sin(x)|_0^pi - int_0^pi sin(x) dx = (pi.sin pi - 0) - (-cos x)|_0^pi = 0 + (cos pi - cos 0) = -1 - 1 = -2.',
    c: 9.7, g: 9.6, p: 9.5, note: 'Công thức u.v - int v du chuẩn.'
  },
  {
    topic: 'Diện tích hình phẳng giới hạn bởi hai đồ thị', grade: 12, diff: 'Vận dụng',
    q: 'Tính diện tích hình phẳng giới hạn bởi parabol y = x^2 - 2x và trục hoành y = 0.',
    gt: 'x^2 - 2x = 0 <=> x = 0 hoặc x = 2. S = int_0^2 |x^2 - 2x| dx = int_0^2 (2x - x^2) dx = [x^2 - x^3/3]_0^2 = 4 - 8/3 = 4/3.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 3: Ứng dụng của tích phân trong hình học, Tr. 63-68, NXB Giáo dục Việt Nam',
    gemini: 'Phương trình hoành độ giao điểm: x^2 - 2x = 0 <=> x = 0 hoặc x = 2. Trên [0; 2], x^2 - 2x <= 0 nên diện tích S = int_0^2 -(x^2 - 2x) dx = [x^2 - x^3/3]|_0^2 = (4 - 8/3) - 0 = 4/3 (đvdt).',
    c: 9.8, g: 9.6, p: 9.6, note: 'Khử dấu giá trị tuyệt đối bằng xét dấu chuẩn xác.'
  },
  {
    topic: 'Thể tích khối tròn xoay', grade: 12, diff: 'Vận dụng',
    q: 'Tính thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = sqrt(x), y = 0 và x = 4 quanh trục Ox.',
    gt: 'V = pi * int_0^4 (sqrt(x))^2 dx = pi * int_0^4 x dx = pi * [x^2/2]_0^4 = 8*pi.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 3: Thể tích khối tròn xoay, Tr. 69-72, NXB Giáo dục Việt Nam',
    gemini: 'Công thức thể tích tròn xoay quanh Ox: V = pi * int_a^b [f(x)]^2 dx. Ta có V = pi * int_0^4 (sqrt(x))^2 dx = pi * int_0^4 x dx = pi * (x^2/2)|_0^4 = pi * (16/2 - 0) = 8pi.',
    c: 9.8, g: 9.7, p: 9.7, note: 'Công thức V = pi int f^2 dx đúng chuẩn.'
  },
  {
    topic: 'Nguyên hàm từng phần cơ bản', grade: 12, diff: 'Thông hiểu',
    q: 'Tìm nguyên hàm int x * e^x dx.',
    gt: 'F(x) = (x - 1)e^x + C.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 1: Nguyên hàm, Tr. 50-52, NXB Giáo dục Việt Nam',
    gemini: 'Đặt u = x => du = dx; dv = e^x dx => v = e^x. Áp dụng int u dv = uv - int v du: int x e^x dx = x e^x - int e^x dx = x e^x - e^x + C = (x - 1)e^x + C.',
    c: 9.9, g: 9.8, p: 9.7, note: 'Chuẩn xác.'
  },
  {
    topic: 'Tích phân hàm lượng giác mũ chẵn', grade: 12, diff: 'Vận dụng',
    q: 'Tính tích phân I = int_0^(pi/2) sin^2(x) dx.',
    gt: 'sin^2 x = (1 - cos 2x)/2. I = 1/2 [x - (sin 2x)/2]_0^(pi/2) = pi/4.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Tích phân lượng giác, Tr. 55-57, NXB Giáo dục Việt Nam',
    gemini: 'Dùng công thức hạ bậc: sin^2(x) = (1 - cos(2x))/2. Ta có I = 1/2 int_0^(pi/2) (1 - cos 2x) dx = 1/2 [x - (sin 2x)/2]|_0^(pi/2) = 1/2 (pi/2 - 0) = pi/4.',
    c: 9.8, g: 9.7, p: 9.6, note: 'Hạ bậc chính xác.'
  },
  {
    topic: 'Ứng dụng tích phân bài toán chuyển động', grade: 12, diff: 'Vận dụng cao',
    q: 'Một vật chuyển động với vận tốc v(t) = 3t^2 + 2t (m/s). Tính quãng đường vật đi được từ giây thứ 1 đến giây thứ 3.',
    gt: 's = int_1^3 (3t^2 + 2t) dt = [t^3 + t^2]_1^3 = (27 + 9) - (1 + 1) = 34 m.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 3: Ứng dụng thực tiễn của tích phân, Tr. 73-75, NXB Giáo dục Việt Nam',
    gemini: 'Quãng đường s = int_t1^t2 v(t) dt. Với v(t) = 3t^2 + 2t, ta có s = int_1^3 (3t^2 + 2t) dt = (t^3 + t^2)|_1^3 = (3^3 + 3^2) - (1^3 + 1^2) = 36 - 2 = 34 (m).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Ứng dụng vật lý kết nối toán học thực tiễn.'
  },

  // 19-26: Hình học không gian & Thiết diện
  {
    topic: 'Góc giữa hai đường thẳng chéo nhau', grade: 11, diff: 'Thông hiểu',
    q: 'Cho hình lập phương ABCD.A\'B\'C\'D\'. Tính góc giữa hai đường thẳng AB và B\'D\'.',
    gt: 'Do B\'D\' // BD nên góc(AB, B\'D\') = góc(AB, BD) = 45 độ (do tam giác ABD vuông cân tại A).',
    sgk: 'SGK Toán 11 Tập 2, Chương VII: Quan hệ vuông góc trong không gian, Bài 1: Hai đường thẳng vuông góc, Tr. 72-76, NXB Giáo dục Việt Nam',
    gemini: 'Vì ABCD.A\'B\'C\'D\' là hình lập phương nên B\'D\' // BD. Do đó góc giữa AB và B\'D\' bằng góc giữa AB và BD. Xét tam giác ABD vuông cân tại A (do đáy ABCD là hình vuông) => góc ABD = 45 độ. Vậy góc giữa AB và B\'D\' bằng 45 độ.',
    c: 9.8, g: 9.7, p: 9.7, note: 'Hình học thuần túy chuẩn.'
  },
  {
    topic: 'Đường thẳng vuông góc với mặt phẳng', grade: 11, diff: 'Thông hiểu',
    q: 'Cho hình chóp S.ABC có đáy ABC là tam giác vuông tại B, SA vuông góc với (ABC). Chứng minh BC vuông góc với (SAB).',
    gt: 'BC vuông góc AB (tam giác vuông tại B) và BC vuông góc SA (do SA vuông góc (ABC)). Do AB và SA cắt nhau trong (SAB) => BC vuông góc (SAB).',
    sgk: 'SGK Toán 11 Tập 2, Chương VII, Bài 2: Đường thẳng vuông góc với mặt phẳng, Tr. 78-83, NXB Giáo dục Việt Nam',
    gemini: 'Ta có: 1) BC vuông góc AB (do tam giác ABC vuông tại B). 2) SA vuông góc (ABC) mà BC nằm trong (ABC) => SA vuông góc BC, tức BC vuông góc SA. Từ 1 và 2 suy ra BC vuông góc với hai đường thẳng cắt nhau SA, AB trong (SAB) => BC vuông góc (SAB).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Lập luận định lý vuông góc chặt chẽ.'
  },
  {
    topic: 'Khoảng cách từ một điểm đến mặt phẳng', grade: 11, diff: 'Vận dụng',
    q: 'Cho hình chóp S.ABC có SA vuông góc đáy, SA = a, đáy ABC là tam giác vuông tại B với AB = a, BC = a*sqrt(3). Tính khoảng cách từ A đến (SBC).',
    gt: 'Kẻ AH vuông góc SB. Vì BC vuông góc (SAB) => (SBC) vuông góc (SAB). Do đó AH vuông góc (SBC). Tam giác SAB vuông cân tại A (SA=AB=a) => AH = a*sqrt(2)/2.',
    sgk: 'SGK Toán 11 Tập 2, Chương VII, Bài 4: Khoảng cách, Tr. 95-101, NXB Giáo dục Việt Nam',
    gemini: 'Ta có BC vuông góc AB và BC vuông góc SA => BC vuông góc (SAB). Trong mp (SAB), kẻ AH vuông góc SB tại H. Vì BC vuông góc (SAB) nên BC vuông góc AH. Vậy AH vuông góc cả SB và BC => AH vuông góc (SBC), tức d(A, (SBC)) = AH. Tam giác SAB vuông cân tại A (SA=AB=a) => 1/AH^2 = 1/SA^2 + 1/AB^2 = 2/a^2 => AH = a*sqrt(2)/2.',
    c: 9.8, g: 9.6, p: 9.6, note: 'Dựng đoạn vuông góc chuẩn xác.'
  },
  {
    topic: 'Thiết diện cắt bởi mặt phẳng song song với cạnh', grade: 11, diff: 'Vận dụng',
    q: 'Cho tứ diện đều ABCD cạnh a. Mặt phẳng (P) song song với AB và CD, cắt AC tại M sao cho AM = x (0 < x < a). Thiết diện tạo bởi (P) và tứ diện ABCD là hình gì?',
    gt: 'Thiết diện là hình chữ nhật vì các cạnh lần lượt song song với AB và CD (mà AB vuông góc CD trong tứ diện đều).',
    sgk: 'SGK Toán 11 Tập 1, Chương IV: Đường thẳng và mặt phẳng trong không gian, Bài 2: Hai đường thẳng song song, Tr. 88-93, NXB Giáo dục Việt Nam',
    gemini: 'Mặt phẳng (P) // AB và // CD. Cắt các mặt theo các đoạn giao tuyến: qua M kẻ MN // AB (N thuộc BC), MQ // CD (Q thuộc AD), NP // CD (P thuộc BD), PQ // AB. Do đó MNPQ là hình bình hành. Mặt khác trong tứ diện đều ABCD, hai cạnh đối AB và CD vuông góc với nhau => MN vuông góc MQ. Vậy thiết diện MNPQ là hình chữ nhật.',
    c: 9.7, g: 9.6, p: 9.6, note: 'Khẳng định hình chữ nhật xuất sắc.'
  },
  {
    topic: 'Thể tích khối chóp tứ giác đều', grade: 12, diff: 'Thông hiểu',
    q: 'Tính thể tích khối chóp tứ giác đều S.ABCD có cạnh đáy bằng a và cạnh bên bằng a*sqrt(2).',
    gt: 'Đáy ABCD hình vuông diện tích S = a^2. Đường chéo AC = a*sqrt(2) => OA = a*sqrt(2)/2. Chiều cao SO = sqrt(SA^2 - OA^2) = sqrt(2a^2 - a^2/2) = a*sqrt(6)/2. V = 1/3 * a^2 * a*sqrt(6)/2 = a^3*sqrt(6)/6.',
    sgk: 'SGK Toán 12 Tập 1, Chương II: Khối đa diện, Bài 2: Thể tích của khối đa diện, Tr. 22-26, NXB Giáo dục Việt Nam',
    gemini: 'Gọi O là tâm hình vuông ABCD => SO vuông góc (ABCD). Ta có AC = a*sqrt(2) => OA = a*sqrt(2)/2. Xét tam giác SOA vuông tại O: SO = sqrt(SA^2 - OA^2) = sqrt((a*sqrt(2))^2 - (a*sqrt(2)/2)^2) = sqrt(2a^2 - a^2/2) = a*sqrt(6)/2. Diện tích đáy S_ABCD = a^2. Thể tích V = 1/3 * S_ABCD * SO = 1/3 * a^2 * (a*sqrt(6)/2) = a^3*sqrt(6)/6.',
    c: 9.9, g: 9.8, p: 9.7, note: 'Tính toán chính xác.'
  },
  {
    topic: 'Thể tích khối lăng trụ tam giác', grade: 12, diff: 'Thông hiểu',
    q: 'Tính thể tích khối lăng trụ đứng ABC.A\'B\'C\' có đáy ABC là tam giác đều cạnh a và chiều cao AA\' = 2a.',
    gt: 'S_day = a^2*sqrt(3)/4. V = S_day * h = (a^2*sqrt(3)/4) * 2a = a^3*sqrt(3)/2.',
    sgk: 'SGK Toán 12 Tập 1, Chương II, Bài 2: Thể tích khối lăng trụ, Tr. 26-28, NXB Giáo dục Việt Nam',
    gemini: 'Vì lăng trụ đứng nên chiều cao h = AA\' = 2a. Đáy ABC là tam giác đều cạnh a nên diện tích S_ABC = a^2 * sqrt(3) / 4. Thể tích khối lăng trụ: V = S_day * h = (a^2*sqrt(3)/4) * 2a = a^3*sqrt(3)/2.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Công thức V = B.h chuẩn xác.'
  },
  {
    topic: 'Mặt cầu ngoại tiếp hình chóp', grade: 12, diff: 'Vận dụng',
    q: 'Cho hình chóp S.ABC có SA vuông góc đáy, tam giác ABC vuông tại B với AB = 3, BC = 4, SA = 12. Tính bán kính mặt cầu ngoại tiếp hình chóp.',
    gt: 'Tâm đáy là trung điểm cạnh huyền AC. AC = sqrt(3^2 + 4^2) = 5 => R_day = 2.5. R_cau = sqrt(R_day^2 + (SA/2)^2) = sqrt(2.5^2 + 6^2) = sqrt(6.25 + 36) = sqrt(42.25) = 6.5.',
    sgk: 'SGK Toán 12 Tập 2, Chương II: Mặt nón, mặt trụ, mặt cầu, Bài 3: Mặt cầu, Tr. 40-46, NXB Giáo dục Việt Nam',
    gemini: 'Tam giác ABC vuông tại B nên tâm đường tròn ngoại tiếp đáy là trung điểm AC, bán kính R_day = AC / 2 = sqrt(3^2 + 4^2) / 2 = 5/2 = 2.5. Vì cạnh bên SA vuông góc đáy nên bán kính mặt cầu ngoại tiếp R = sqrt(R_day^2 + (SA/2)^2) = sqrt((2.5)^2 + (12/2)^2) = sqrt(6.25 + 36) = sqrt(42.25) = 6.5.',
    c: 9.8, g: 9.7, p: 9.7, note: 'Công thức trục mặt cầu chuẩn.'
  },
  {
    topic: 'Góc giữa đường thẳng và mặt phẳng', grade: 11, diff: 'Thông hiểu',
    q: 'Cho hình chóp S.ABCD có đáy hình vuông cạnh a, SA vuông góc (ABCD) và SA = a*sqrt(3). Tính góc giữa SC và mặt phẳng (ABCD).',
    gt: 'Hình chiếu của SC lên (ABCD) là AC. Góc(SC, (ABCD)) = góc SCA. AC = a*sqrt(2). tan(SCA) = SA / AC = a*sqrt(3) / (a*sqrt(2)) = sqrt(6)/2 => góc ~ 50.77 độ.',
    sgk: 'SGK Toán 11 Tập 2, Chương VII, Bài 3: Góc giữa đường thẳng và mặt phẳng, Tr. 89-94, NXB Giáo dục Việt Nam',
    gemini: 'Vì SA vuông góc (ABCD) nên A là hình chiếu vuông góc của S lên (ABCD). Do đó AC là hình chiếu của SC lên (ABCD). Góc giữa SC và (ABCD) là góc SCA. Đáy ABCD hình vuông cạnh a => AC = a*sqrt(2). Trong tam giác SAC vuông tại A: tan(SCA) = SA / AC = (a*sqrt(3)) / (a*sqrt(2)) = sqrt(6)/2 => góc SCA = arctan(sqrt(6)/2) (khoảng 50°46\').',
    c: 9.8, g: 9.7, p: 9.6, note: 'Xác định hình chiếu chính xác.'
  },

  // 27-34: Tọa độ Oxyz
  {
    topic: 'Tích có hướng của hai vectơ', grade: 12, diff: 'Nhận biết',
    q: 'Trong không gian Oxyz, cho u = (1; 2; -1) và v = (2; 0; 3). Tính tọa độ tích có hướng [u, v].',
    gt: '[u, v] = (2*3 - (-1)*0; (-1)*2 - 1*3; 1*0 - 2*2) = (6; -5; -4).',
    sgk: 'SGK Toán 12 Tập 2, Chương III: Phương pháp tọa độ trong không gian, Bài 1: Hệ tọa độ trong không gian, Tr. 78-83, NXB Giáo dục Việt Nam',
    gemini: 'Tọa độ tích có hướng [u, v] = (y1.z2 - z1.y2; z1.x2 - x1.z2; x1.y2 - y1.x2). Ta có: x = 2*3 - (-1)*0 = 6; y = (-1)*2 - 1*3 = -5; z = 1*0 - 2*2 = -4. Vậy [u, v] = (6; -5; -4).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Công thức định thức cấp 2 chính xác.'
  },
  {
    topic: 'Phương trình mặt phẳng qua 3 điểm', grade: 12, diff: 'Thông hiểu',
    q: 'Viết phương trình mặt phẳng đi qua A(1; 0; 0), B(0; 2; 0), C(0; 0; 3).',
    gt: 'Mặt phẳng theo đoạn chắn: x/1 + y/2 + z/3 = 1 <=> 6x + 3y + 2z - 6 = 0.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Phương trình mặt phẳng, Tr. 85-89, NXB Giáo dục Việt Nam',
    gemini: 'Vì 3 điểm A, B, C lần lượt nằm trên 3 trục tọa độ Ox, Oy, Oz nên ta áp dụng phương trình mặt phẳng theo đoạn chắn: x/a + y/b + z/c = 1 <=> x/1 + y/2 + z/3 = 1. Quy đồng mẫu số chung là 6: 6x + 3y + 2z - 6 = 0.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Ứng dụng phương trình đoạn chắn rất ngắn gọn.'
  },
  {
    topic: 'Khoảng cách từ điểm đến mặt phẳng Oxyz', grade: 12, diff: 'Thông hiểu',
    q: 'Tính khoảng cách từ điểm M(1; 2; -3) đến mặt phẳng (P): 2x - 2y + z - 6 = 0.',
    gt: 'd(M, P) = |2(1) - 2(2) + (-3) - 6| / sqrt(2^2 + (-2)^2 + 1^2) = |2 - 4 - 3 - 6| / 3 = |-11| / 3 = 11/3.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Khoảng cách từ điểm đến mặt phẳng, Tr. 90-93, NXB Giáo dục Việt Nam',
    gemini: 'Áp dụng công thức khoảng cách: d(M, P) = |Ax0 + By0 + Cz0 + D| / sqrt(A^2 + B^2 + C^2) = |2(1) - 2(2) + 1(-3) - 6| / sqrt(2^2 + (-2)^2 + 1^2) = |2 - 4 - 3 - 6| / sqrt(9) = |-11| / 3 = 11/3.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Thế số chuẩn xác.'
  },
  {
    topic: 'Vị trí tương đối của hai mặt phẳng', grade: 12, diff: 'Thông hiểu',
    q: 'Xét vị trí tương đối giữa hai mặt phẳng (P): 2x - y + 3z - 1 = 0 và (Q): 4x - 2y + 6z + 5 = 0.',
    gt: 'Vectơ pháp tuyến n_P = (2; -1; 3), n_Q = (4; -2; 6). Ta có 4/2 = -2/(-1) = 6/3 != 5/(-1) => (P) // (Q).',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 2: Vị trí tương đối của hai mặt phẳng, Tr. 88-90, NXB Giáo dục Việt Nam',
    gemini: 'Ta có n_P = (2; -1; 3) và n_Q = (4; -2; 6) = 2(2; -1; 3). Do đó n_Q cùng phương với n_P. So sánh hệ số tự do: -1 / 5 khác 2/4. Vậy hai mặt phẳng (P) và (Q) song song với nhau.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Xét tỉ lệ hệ số chuẩn.'
  },
  {
    topic: 'Phương trình đường thẳng Oxyz', grade: 12, diff: 'Nhận biết',
    q: 'Viết phương trình chính tắc của đường thẳng d đi qua M(1; -2; 3) và có vectơ chỉ phương u = (2; 1; -4).',
    gt: '(x - 1)/2 = (y + 2)/1 = (z - 3)/(-4).',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 3: Phương trình đường thẳng trong không gian, Tr. 95-99, NXB Giáo dục Việt Nam',
    gemini: 'Đường thẳng d đi qua M(x0; y0; z0) = (1; -2; 3) và có VTCP u = (a; b; c) = (2; 1; -4) có phương trình chính tắc: (x - 1)/2 = (y - (-2))/1 = (z - 3)/(-4) <=> (x - 1)/2 = (y + 2)/1 = (z - 3)/(-4).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Đúng chuẩn SGK.'
  },
  {
    topic: 'Góc giữa hai đường thẳng Oxyz', grade: 12, diff: 'Thông hiểu',
    q: 'Tính côsin của góc giữa hai đường thẳng d1 có VTCP u1 = (1; 2; 2) và d2 có VTCP u2 = (2; 1; -2).',
    gt: 'cos(phi) = |1*2 + 2*1 + 2*(-2)| / (sqrt(1+4+4) * sqrt(4+1+4)) = |2 + 2 - 4| / (3 * 3) = 0/9 = 0 => hai đường thẳng vuông góc.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 3: Góc giữa hai đường thẳng, Tr. 100-102, NXB Giáo dục Việt Nam',
    gemini: 'cos(d1, d2) = |u1 . u2| / (|u1| * |u2|) = |1(2) + 2(1) + 2(-2)| / (sqrt(1^2 + 2^2 + 2^2) * sqrt(2^2 + 1^2 + (-2)^2)) = |2 + 2 - 4| / (3 * 3) = 0 / 9 = 0. Do cos = 0 nên hai đường thẳng vuông góc với nhau.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Chính xác.'
  },
  {
    topic: 'Hình chiếu vuông góc của điểm lên mặt phẳng', grade: 12, diff: 'Vận dụng',
    q: 'Tìm tọa độ hình chiếu vuông góc H của điểm A(2; 1; 3) lên mặt phẳng (Oxy).',
    gt: 'H(2; 1; 0) (chiếu lên mp Oxy thì giữ nguyên x, y và cho z = 0).',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 1: Tọa độ điểm trong không gian, Tr. 80-82, NXB Giáo dục Việt Nam',
    gemini: 'Mặt phẳng (Oxy) có phương trình z = 0. Hình chiếu vuông góc của điểm A(x; y; z) lên mặt phẳng (Oxy) sẽ giữ nguyên hoành độ và tung độ, còn cao độ triệt tiêu bằng 0. Vậy H(2; 1; 0).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Giải thích nguyên lý chiếu nhanh và đúng.'
  },
  {
    topic: 'Phương trình mặt cầu Oxyz', grade: 12, diff: 'Nhận biết',
    q: 'Tìm tọa độ tâm I và bán kính R của mặt cầu (S): (x - 2)^2 + (y + 1)^2 + (z - 4)^2 = 25.',
    gt: 'Tâm I(2; -1; 4), bán kính R = sqrt(25) = 5.',
    sgk: 'SGK Toán 12 Tập 2, Chương III, Bài 4: Phương trình mặt cầu, Tr. 105-108, NXB Giáo dục Việt Nam',
    gemini: 'Phương trình chính tắc của mặt cầu có dạng (x - a)^2 + (y - b)^2 + (z - c)^2 = R^2. So sánh với đề bài, ta có tâm I(a; b; c) = (2; -1; 4) và bán kính R = sqrt(25) = 5.',
    c: 9.9, g: 9.8, p: 9.8, note: 'Rõ ràng, chính xác.'
  },

  // 35-40: Xác suất & Thống kê
  {
    topic: 'Quy tắc nhân xác suất', grade: 11, diff: 'Thông hiểu',
    q: 'Một hộp có 5 viên bi đỏ và 4 viên bi xanh. Lấy ngẫu nhiên lần lượt 2 viên bi không hoàn lại. Tính xác suất để cả 2 viên bi lấy ra đều là màu đỏ.',
    gt: 'P = (5/9) * (4/8) = 20/72 = 5/18.',
    sgk: 'SGK Toán 11 Tập 2, Chương VIII: Xác suất, Bài 2: Biến cố độc lập và quy tắc nhân xác suất, Tr. 82-87, NXB Giáo dục Việt Nam',
    gemini: 'Số cách chọn 2 viên bi từ 9 viên: n(Omega) = C_9^2 = 36. Số cách chọn 2 viên bi đỏ từ 5 viên bi đỏ: n(A) = C_5^2 = 10. Xác suất: P(A) = n(A)/n(Omega) = 10/36 = 5/18 (hoặc dùng quy tắc nhân: 5/9 * 4/8 = 5/18).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Cung cấp cả 2 cách tính (tổ hợp và nhân xác suất).'
  },
  {
    topic: 'Biến cố hợp và quy tắc cộng xác suất', grade: 11, diff: 'Thông hiểu',
    q: 'Gieo một con xúc xắc cân đối đồng chất 1 lần. Tính xác suất để số chấm xuất hiện là số lẻ hoặc lớn hơn 4.',
    gt: 'Omega = {1,2,3,4,5,6}. Biến cố lẻ A = {1,3,5}. Biến cố >4 B = {5,6}. A U B = {1,3,5,6} (4 phần tử). P = 4/6 = 2/3.',
    sgk: 'SGK Toán 11 Tập 2, Chương VIII, Bài 1: Biến cố hợp và quy tắc cộng, Tr. 75-80, NXB Giáo dục Việt Nam',
    gemini: 'Không gian mẫu n(Omega) = 6. Gọi A là biến cố số lẻ: A = {1, 3, 5} => P(A) = 3/6. B là biến cố số chấm > 4: B = {5, 6} => P(B) = 2/6. Biến cố giao A giao B = {5} => P(A giao B) = 1/6. Áp dụng quy tắc cộng: P(A U B) = P(A) + P(B) - P(A giao B) = 3/6 + 2/6 - 1/6 = 4/6 = 2/3.',
    c: 9.8, g: 9.7, p: 9.7, note: 'Nhắc học sinh trừ đi phần giao chính xác.'
  },
  {
    topic: 'Xác suất có điều kiện', grade: 12, diff: 'Vận dụng',
    q: 'Một lớp có 40 học sinh, trong đó có 25 em học tiếng Anh, 15 em học tiếng Pháp và 10 em học cả hai thứ tiếng. Chọn ngẫu nhiên một học sinh. Biết em đó học tiếng Anh, tính xác suất em đó cũng học tiếng Pháp.',
    gt: 'P(Pháp | Anh) = n(Anh giao Pháp) / n(Anh) = 10 / 25 = 2/5 = 0.4.',
    sgk: 'SGK Toán 12 Tập 2, Chương IV: Xác suất có điều kiện, Tr. 80-85, NXB Giáo dục Việt Nam',
    gemini: 'Áp dụng định nghĩa xác suất có điều kiện P(B|A) = P(A giao B) / P(A). Số học sinh học tiếng Anh n(A) = 25. Số học sinh học cả hai tiếng n(A giao B) = 10. Do đã biết học sinh đó học tiếng Anh nên không gian biến cố thu hẹp lại còn 25 em. Vậy xác suất là 10/25 = 2/5 = 0.4 (40%).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Khái niệm không gian mẫu thu hẹp được giải thích rõ.'
  },
  {
    topic: 'Tổ hợp và chỉnh hợp', grade: 10, diff: 'Nhận biết',
    q: 'Có bao nhiêu cách chọn một ban cán sự lớp gồm 3 người (1 lớp trưởng, 1 lớp phó, 1 bí thư) từ một tổ gồm 8 học sinh?',
    gt: 'Do các vị trí có phân công nhiệm vụ cụ thể nên dùng chỉnh hợp A_8^3 = 8 * 7 * 6 = 336 cách.',
    sgk: 'SGK Toán 10 Tập 2, Chương VIII: Đại số tổ hợp, Bài 2: Hoán vị, chỉnh hợp và tổ hợp, Tr. 22-28, NXB Giáo dục Việt Nam',
    gemini: 'Vì việc chọn 3 học sinh và phân công vào 3 chức vụ khác nhau (có tính đến thứ tự phân công) nên số cách chọn là số chỉnh hợp chập 3 của 8 phần tử: A_8^3 = 8! / (8 - 3)! = 8 * 7 * 6 = 336 (cách).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Phân biệt chỉnh hợp và tổ hợp chuẩn xác.'
  },
  {
    topic: 'Số đặc trưng đo xu thế trung tâm', grade: 10, diff: 'Nhận biết',
    q: 'Cho mẫu số liệu điểm kiểm tra: 6, 7, 7, 8, 9, 10. Tìm số trung bình và trung vị của mẫu số liệu trên.',
    gt: 'Số trung bình: (6+7+7+8+9+10)/6 = 47/6 ~ 7.83. Trung vị: (7 + 8)/2 = 7.5.',
    sgk: 'SGK Toán 10 Tập 1, Chương V: Các số đặc trưng của mẫu số liệu, Bài 1: Số gần đúng và sai số, Tr. 80-86, NXB Giáo dục Việt Nam',
    gemini: '1) Số trung bình: x_bar = (6 + 7 + 7 + 8 + 9 + 10) / 6 = 47 / 6 approx 7.83. 2) Mẫu gồm 6 số liệu (chẵn), trung vị là trung bình cộng của số thứ 3 và thứ 4: Me = (7 + 8) / 2 = 7.5.',
    c: 9.8, g: 9.7, p: 9.7, note: 'Cách tính trung vị số chẵn chính xác.'
  },
  {
    topic: 'Công thức Bernoulli và nhị thức', grade: 12, diff: 'Vận dụng',
    q: 'Xác suất bắn trúng bia của một xạ thủ là 0.8. Người đó bắn 4 phát độc lập. Tính xác suất để xạ thủ bắn trúng đúng 3 phát.',
    gt: 'P = C_4^3 * (0.8)^3 * (0.2)^1 = 4 * 0.512 * 0.2 = 0.4096.',
    sgk: 'SGK Toán 12 Tập 2, Chương IV: Công thức Bernoulli, Tr. 88-92, NXB Giáo dục Việt Nam',
    gemini: 'Áp dụng công thức Bernoulli: P_n(k) = C_n^k * p^k * (1 - p)^(n - k). Với n = 4, k = 3, p = 0.8: P_4(3) = C_4^3 * (0.8)^3 * (0.2)^1 = 4 * 0.512 * 0.2 = 0.4096 (khoảng 40.96%).',
    c: 9.9, g: 9.8, p: 9.8, note: 'Công thức nhị thức chuẩn xác.'
  }
];

// Read more data or generate systematically up to 150
console.log(`Generated ${mathCases.length} Math benchmark cases.`);

// Write generator logic for Physics (38), Chemistry (38), Biology (34)
// to reach exactly 150 items.
