import fs from 'fs';
import path from 'path';

const existingCorpus = JSON.parse(fs.readFileSync('src/ai-training/datasets/rag-knowledge/stem-corpus.json', 'utf-8'));

const newTopics = [];

// Add Chemistry topics to reach 25
const chemAdditions = [
  { id: "hoa-009", subject: "hoa", topic: "Phản ứng Nhiệt Nhôm", content: "Phản ứng nhiệt nhôm là phản ứng khử oxit kim loại (như Fe2O3, Fe3O4, Cr2O3) bằng bột nhôm ở nhiệt độ cao. Phản ứng phát nhiệt rất mạnh: 2Al + Fe2O3 -> Al2O3 + 2Fe (t°). Ứng dụng để hàn đường ray tàu hỏa và điều chế các kim loại khó khử." },
  { id: "hoa-010", subject: "hoa", topic: "Điện phân Dung dịch Cụ thể", content: "Điện phân dung dịch CuSO4 với anôt catôt bằng graphite: Tại catôt (cực âm) xảy ra sự khử Cu2+ thành Cu kết tủa: Cu2+ + 2e -> Cu. Tại anôt (cực dương) xảy ra sự oxi hóa H2O giải phóng O2 và H+: 2H2O -> O2 + 4H+ + 4e. Dung dịch sau điện phân có tính axit H2SO4." },
  { id: "hoa-011", subject: "hoa", topic: "Polime và Vật liệu Polime", content: "Polime là những hợp chất có khối lượng phân tử rất lớn do nhiều đơn vị nhỏ (mắt xích) liên kết với nhau. Tơ nilon-6,6 thuộc loại tơ tổng hợp (tơ polyamide) được điều chế bằng phản ứng trùng ngưng giữa hexamethylenediamine và axit adipic." },
  { id: "hoa-012", subject: "hoa", topic: "Kim loại Kiềm và Kiềm Thổ", content: "Kim loại kiềm (nhóm IA: Na, K) có tính khử rất mạnh, phản ứng mãnh liệt với nước ở nhiệt độ thường giải phóng H2: 2Na + 2H2O -> 2NaOH + H2. Bảo quản kim loại kiềm bằng cách ngâm chìm trong dầu hỏa." },
  { id: "hoa-013", subject: "hoa", topic: "Halogen và Tính Oxi hóa", content: "Các halogen (F2, Cl2, Br2, I2) có tính oxi hóa giảm dần từ flo đến iot. Flo có tính oxi hóa mạnh nhất, tác dụng được với nước giải phóng O2: 2F2 + 2H2O -> 4HF + O2." },
  { id: "hoa-014", subject: "hoa", topic: "Ancol và Anđehit", content: "Oxi hóa ancol bậc 1 bằng CuO đun nóng thu được anđehit: RCH2OH + CuO -> RCHO + Cu + H2O. Oxi hóa ancol bậc 2 thu được xeton. Ancol bậc 3 không bị oxi hóa bởi CuO." },
  { id: "hoa-015", subject: "hoa", topic: "Axit Cacboxylic", content: "Axit cacboxylic RCOOH làm quỳ tím hóa đỏ, tác dụng với kim loại trước H, bazơ, oxit bazơ và muối cacbonat giải phóng CO2. Phản ứng este hóa giữa RCOOH và R'OH là phản ứng thuận nghịch có H2SO4 đặc làm tác nhân hút nước và xúc tác." },
  { id: "hoa-016", subject: "hoa", topic: "Phân bón Hóa học", content: "Độ dinh dưỡng của phân đạm được đánh giá theo phần trăm khối lượng N. Độ dinh dưỡng của phân lân đánh giá theo % P2O5. Độ dinh dưỡng của phân kali đánh giá theo % K2O." },
  { id: "hoa-017", subject: "hoa", topic: "Xà phòng và Chất Giặt rửa", content: "Xà phòng gồm các muối natri hoặc kali của axit béo (như C17H35COONa). Đầu COONa thân nước, đuôi hyđrocacbon dài C17H35 kỵ nước. Chất giặt rửa tổng hợp không bị kết tủa trong nước cứng." },
  { id: "hoa-018", subject: "hoa", topic: "Hợp chất Crôm", topic: "Hợp chất Cr(III) như Cr2O3, Cr(OH)3 có tính lưỡng tính. Hợp chất Cr(VI) như CrO3 có tính oxi hóa rất mạnh, tự bùng cháy khi tiếp xúc với cồn (C2H5OH)." },
  { id: "hoa-019", subject: "hoa", topic: "Nước Cứng và Cách Làm Mềm", content: "Nước cứng chứa nhiều ion Ca2+ và Mg2+. Nước cứng tạm thời chứa Ca(HCO3)2, Mg(HCO3)2, làm mềm bằng cách đun sôi hoặc dùng NaOH, Ca(OH)2 vừa đủ, Na2CO3, Na3PO4." },
  { id: "hoa-020", subject: "hoa", topic: "Hóa học Môi trường", content: "Mưa axit do khí SO2 và NOx trong khí thải công nghiệp hòa tan vào nước mưa tạo thành H2SO4 và HNO3 làm giảm pH dưới 5.6 gây hại hệ sinh thái." },
  { id: "hoa-021", subject: "hoa", topic: "Glucozơ và Lên men Ancol", content: "Phản ứng lên men glucozơ ở 30-35°C tạo ra ancol etylic và khí cacbonic: C6H12O6 -> 2C2H5OH + 2CO2 (xúc tác enzym)." },
  { id: "hoa-022", subject: "hoa", topic: "Protein và Phản ứng Màu Biurê", content: "Peptit từ 2 liên kết peptit trở lên (tripeptit trở lên) phản ứng với Cu(OH)2 trong môi trường kiềm tạo hợp chất màu tím đặc trưng gọi là phản ứng màu biurê." },
  { id: "hoa-023", subject: "hoa", topic: "Đồng phân Quang học", content: "Phân tử có nguyên tử cacbon bất đối (cacbon liên kết với 4 nhóm thế khác nhau) xuất hiện tính hoạt quang và tồn tại các cặp đồng phân đối quang (enantiomer)." },
  { id: "hoa-024", subject: "hoa", topic: "Chuẩn độ Oxi hóa Khử", content: "Chuẩn độ Fe2+ bằng KMnO4 trong môi trường H2SO4 loãng: 5Fe2+ + MnO4- + 8H+ -> 5Fe3+ + Mn2+ + 4H2O. Nhận biết điểm tương đương khi dung dịch chuyển sang màu hồng nhạt vĩnh viễn." },
  { id: "hoa-025", subject: "hoa", topic: "Hiệu ứng Nhà kính", content: "Khí CO2, CH4, N2O hấp thụ bức xạ hồng ngoại từ mặt đất phát ra giữ nhiệt lại trong tầng đối lưu gây ra hiện tượng nóng lên toàn cầu." }
];

// Add Physics topics to reach 25
const physAdditions = [
  { id: "ly-007", subject: "ly", topic: "Sóng Điện từ và Mạch LC", content: "Mạch dao động LC gồm cuộn cảm L và tụ điện C. Tần số góc dao động riêng omega = 1/sqrt(L*C). Tần số f = 1/(2*pi*sqrt(L*C)). Sóng điện từ là sóng ngang, lan truyền trong chân không với tốc độ c = 3x10^8 m/s." },
  { id: "ly-008", subject: "ly", topic: "Tán sắc Ánh sáng", content: "Hiện tượng tán sắc ánh sáng là sự phân tách ánh sáng phức tạp thành các ánh sáng đơn sắc. Trong thủy tinh, chiết suất của môi trường đối với ánh sáng đỏ n_đỏ là nhỏ nhất, đối với ánh sáng tím n_tím là lớn nhất." },
  { id: "ly-009", subject: "ly", topic: "Quang phổ và Ứng dụng", content: "Quang phổ liên tục do các chất rắn, lỏng, khí có áp suất lớn được nung nóng phát ra, chỉ phụ thuộc nhiệt độ. Quang phổ vạch phát xạ do khí ở áp suất thấp bị kích thích phát ra, đặc trưng cho nguyên tố." },
  { id: "ly-010", subject: "ly", topic: "Tia X và Tính chất", content: "Tia X (tia Rơn-ghen) là sóng điện từ có bước sóng rất ngắn (10^-11 đến 10^-8 m). Tia X có khả năng đâm xuyên mạnh, làm đen kính ảnh, làm phát quang nhiều chất, ionized không khí." },
  { id: "ly-011", subject: "ly", topic: "Hạt nhân và Năng lượng Liên kết", content: "Độ hụt khối Delta m = Z*m_p + (A - Z)*m_n - m_hn. Năng lượng liên kết E_lk = Delta m * c^2. Năng lượng liên kết riêng E_lkr = E_lk / A đặc trưng cho độ bền vững của hạt nhân." },
  { id: "ly-012", subject: "ly", topic: "Phóng xạ và Định luật Phóng xạ", content: "Phóng xạ là quá trình hạt nhân không bền vững tự phân rã phát ra các tia phóng xạ (alpha, beta, gamma) và biến đổi thành hạt nhân khác. Số hạt còn lại N(t) = N0 * 2^(-t/T)." },
  { id: "ly-013", subject: "ly", topic: "Phản ứng Phân hạch và Nhiệt hạch", content: "Phân hạch là sự vỡ một hạt nhân nặng thành hai hạt nhân trung bình. Nhiệt hạch là sự kết hợp hai hạt nhân nhẹ thành hạt nhân nặng hơn ở nhiệt độ cực cao. Cả hai phản ứng đều tỏa năng lượng rất lớn." },
  { id: "ly-014", subject: "ly", topic: "Dao động Tắt dần và Bắt buộc", content: "Dao động tắt dần có biên độ giảm dần theo thời gian do ma sát. Dao động cưỡng bức có biên độ không đổi và tần số bằng tần số f_f của ngoại lực cưỡng bức. Cộng hưởng xảy ra khi f_f = f0." },
  { id: "ly-015", subject: "ly", topic: "Máy Biến áp và Truyền tải Điện", content: "Máy biến áp hoạt động dựa trên hiện tượng cảm ứng điện từ: U1/U2 = N1/N2. Công suất hao phí trên đường dây tải điện Delta P = R * P^2 / (U^2 * cos^2 phi). Tăng điện áp U lên n lần làm giảm hao phí n^2 lần." },
  { id: "ly-016", subject: "ly", topic: "Quang điện Trong và Quang trở", content: "Hiện tượng quang điện trong là sự bứt electron liên kết thành electron dẫn khi chiếu ánh sáng thích hợp vào bán dẫn. Ứng dụng chế tạo quang điện trở (LDR) và pin mặt trời." },
  { id: "ly-017", subject: "ly", topic: "Mẫu Nguyên tử Bohr", content: "Nguyên tử chỉ tồn tại trong các trạng thái dừng có năng lượng E_n xác định. Khi chuyển từ E_n sang E_m (E_n > E_m), nguyên tử phát ra photon có năng lượng h*f = E_n - E_m." },
  { id: "ly-018", subject: "ly", topic: "Mắt và Các Tật của Mắt", content: "Mắt cận thị có điểm cực viễn Cv ở khoảng cách hữu hạn, tiêu điểm F nằm trước võng mạc, khắc phục bằng kính phân kỳ. Mắt lão thị hoặc viễn thị khắc phục bằng kính hội tụ." },
  { id: "ly-019", subject: "ly", topic: "Thấu kính Mỏng", content: "Công thức thấu kính: 1/f = 1/d + 1/d'. Độ phóng đại ảnh k = -d'/d. Thấu kính hội tụ f > 0, thấu kính phân kỳ f < 0. Ảnh thật d' > 0, ảnh ảo d' < 0." },
  { id: "ly-020", subject: "ly", topic: "Khúc xạ Ánh sáng", content: "Định luật khúc xạ: n1 * sin(i) = n2 * sin(r). Hiện tượng phản xạ toàn phần xảy ra khi ánh sáng truyền từ môi trường chiết quang hơn sang kém hơn (n1 > n2) và góc tới i >= i_gh với sin(i_gh) = n2/n1." },
  { id: "ly-021", subject: "ly", topic: "Laser và Đặc tính", content: "Tia Laser có tính đơn sắc cao, tính định hướng cao, tính kết hợp cao và cường độ lớn. Laser hoạt động dựa trên hiện tượng bức xạ phát xạ cưỡng bức." },
  { id: "ly-022", subject: "ly", topic: "Lực Lorenxơ", content: "Lực Lorenxơ tác dụng lên hạt mang điện q di chuyển với vận tốc v trong từ trường B: f = |q| * v * B * sin(alpha). Lực Lorenxơ vuông góc với vận tốc nên không sinh công, chỉ làm đổi hướng chuyển động." },
  { id: "ly-023", subject: "ly", topic: "Từ trường và Lực Ampe", content: "Lực Ampe tác dụng lên đoạn dây dẫn mang dòng điện I dài L đặt trong từ trường B: F = B * I * L * sin(alpha). Quy tắc bàn tay trái xác định chiều của lực Ampe." },
  { id: "ly-024", subject: "ly", topic: "Hiện tượng Cảm ứng Điện từ", content: "Suất điện động cảm ứng e_c = - dPhi / dt. Từ thông Phi = B * S * cos(alpha). Chiều dòng điện cảm ứng tuân theo định luật Lenz: chống lại sự biến thiên của từ thông sinh ra nó." },
  { id: "ly-025", subject: "ly", topic: "Tụ điện và Năng lượng Điện trường", content: "Điện dung Tụ điện C = Q / U. Năng lượng điện trường tích trữ trong tụ điện W = 0.5 * C * U^2 = 0.5 * Q^2 / C." }
];

// Add Math topics to reach 25
const mathAdditions = [
  { id: "toan-006", subject: "toan", topic: "Tiệm cận Đồ thị Hàm số", content: "Đường thẳng x = x0 là tiệm cận đứng của đồ thị y = f(x) nếu lim_{x->x0} f(x) = infinity. Đường thẳng y = y0 là tiệm cận ngang nếu lim_{x->infinity} f(x) = y0. Đồ thị y = (ax+b)/(cx+d) có tiệm cận đứng x = -d/c và tiệm cận ngang y = a/c." },
  { id: "toan-007", subject: "toan", topic: "Giá trị Cực đại Cực tiểu", content: "Phương pháp tìm GTLN và GTNN của hàm số continuous trên đoạn [a, b]: Tính f'(x), tìm các điểm x_i thuộc (a, b) làm f'(x) = 0 hoặc không xác định. Tính f(a), f(b), f(x_i). Số lớn nhất là GTLN, nhỏ nhất là GTNN." },
  { id: "toan-008", subject: "toan", topic: "Phương trình Mũ và Logarit", content: "Phương trình a^x = b (a > 0, a != 1): Vô nghiệm nếu b <= 0, có nghiệm duy nhất x = log_a(b) nếu b > 0. Phương trình log_a(x) = b có nghiệm x = a^b (điều kiện x > 0)." },
  { id: "toan-009", subject: "toan", topic: "Khối Đa diện và Thể tích", content: "Thể tích khối chóp V = (1/3) * B * h (B là diện tích đáy, h là chiều cao). Thể tích khối lăng trụ V = B * h. Thể tích khối hộp chữ nhật V = a * b * c." },
  { id: "toan-010", subject: "toan", topic: "Nón - Trụ - Cầu", content: "Hình nón: Diện tích xung quanh S_xq = pi * r * l, thể tích V = (1/3) * pi * r^2 * h. Hình trụ: S_xq = 2 * pi * r * h, V = pi * r^2 * h. Mặt cầu: S = 4 * pi * R^2, thể tích khối cầu V = (4/3) * pi * R^3." },
  { id: "toan-011", subject: "toan", topic: "Khoảng cách trong Oxyz", content: "Khoảng cách từ điểm M0(x0, y0, z0) đến mặt phẳng (P): ax + by + cz + d = 0 là d(M0, P) = |a*x0 + b*y0 + c*z0 + d| / sqrt(a^2 + b^2 + c^2)." },
  { id: "toan-012", subject: "toan", topic: "Góc giữa Hai Đường thẳng", content: "Góc phi giữa hai đường thẳng d1, d2 có vector chỉ phương u1=(a1,b1,c1), u2=(a2,b2,c2) tính theo cos(phi) = |u1 . u2| / (|u1| * |u2|)." },
  { id: "toan-013", subject: "toan", topic: "Cấp số Cộng và Cấp số Nhân", content: "Cấp số cộng: u_n = u1 + (n-1)*d, tổng S_n = n*(u1 + u_n)/2. Cấp số nhân: u_n = u1 * q^(n-1), tổng S_n = u1*(1 - q^n)/(1 - q) (với q != 1)." },
  { id: "toan-014", subject: "toan", topic: "Tổ hợp và Xác suất", content: "Số chỉnh hợp A_n^k = n! / (n-k)!. Số tổ hợp C_n^k = n! / (k! * (n-k)!). Xác suất biến cố A: P(A) = n(A) / n(Omega). Công thức cộng xác suất P(A u B) = P(A) + P(B) - P(A n B)." },
  { id: "toan-015", subject: "toan", topic: "Bất phương trình Mũ và Logarit", content: "Bất phương trình a^f(x) > a^g(x): Khi a > 1 <=> f(x) > g(x). Khi 0 < a < 1 <=> f(x) < g(x). Cần nhớ đổi chiều bất phương trình khi cơ số 0 < a < 1." },
  { id: "toan-016", subject: "toan", topic: "Tích phân Đổi biến số", content: "Đổi biến t = u(x) => dt = u'(x) dx. Tích phân int_a^b f(u(x)) u'(x) dx = int_{u(a)}^{u(b)} f(t) dt. Đổi biến cần đổi cận tương ứng." },
  { id: "toan-017", subject: "toan", topic: "Tích phân Từng phần", content: "Công thức tích phân từng phần: int u dv = u*v - int v du. Thứ tự ưu tiên chọn u: Nhất lôt (logarit), nhì đa (đa thức), tam lượng (lượng giác), tứ mũ (mũ)." },
  { id: "toan-018", subject: "toan", topic: "Mặt phẳng Tiếp xúc Mặt cầu", content: "Mặt phẳng (P) tiếp xúc mặt cầu S(I, R) khi và chỉ khi khoảng cách d(I, P) = R. Phương trình mặt cầu tâm I(a, b, c) bán kính R là (x-a)^2 + (y-b)^2 + (z-c)^2 = R^2." },
  { id: "toan-019", subject: "toan", topic: "Phương trình Lượng giác Cơ bản", content: "sin(x) = sin(alpha) <=> x = alpha + k*2*pi hoặc x = pi - alpha + k*2*pi. cos(x) = cos(alpha) <=> x = +/- alpha + k*2*pi." },
  { id: "toan-020", subject: "toan", topic: "Đạo hàm Hàm Hợp", content: "Công thức đạo hàm hàm hợp: (y(u(x)))' = y'(u) * u'(x). Ví dụ: (sin(u))' = u' * cos(u), (e^u)' = u' * e^u, (ln u)' = u' / u." },
  { id: "toan-021", subject: "toan", topic: "Tọa độ Vector trong Oxyz", content: "Tích có hướng của u=(a1,b1,c1) và v=(a2,b2,c2) là vector w = [u, v] = (b1*c2 - c1*b2, c1*a2 - a1*c2, a1*b2 - b1*a2). [u, v] vuông góc với cả u và v." },
  { id: "toan-022", subject: "toan", topic: "Tính Thể tích Khối Tròn xoay", content: "Thể tích khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi y = f(x), trục Ox, x=a, x=b quanh trục Ox là V = pi * int_a^b [f(x)]^2 dx." },
  { id: "toan-023", subject: "toan", topic: "Biểu diễn Hình học Số phức", content: "Điểm M(a, b) trong mặt phẳng tọa độ Oxy biểu diễn số phức z = a + bi. Tập hợp các điểm M biểu diễn z thỏa mãn |z - z0| = R là đường tròn tâm I(z0) bán kính R." },
  { id: "toan-024", subject: "toan", topic: "Nhị thức Newton", content: "Công thức Nhị thức Newton: (a + b)^n = sum_{k=0}^n C_n^k * a^(n-k) * b^k. Số hạng tổng quát T_{k+1} = C_n^k * a^(n-k) * b^k." },
  { id: "toan-025", subject: "toan", topic: "Khảo sát Đồ thị Hàm Bậc bốn", content: "Hàm trùng phương y = ax^4 + bx^2 + c (a != 0). Có 3 điểm cực trị khi a*b < 0. Có 1 điểm cực trị khi a*b >= 0." }
];

// Add Biology topics to reach 25
const bioAdditions = [
  { id: "sinh-007", subject: "sinh", topic: "Phiên mã tạo mARN", content: "Quá trình phiên mã tổng hợp mARN diễn ra trên mạch khuôn 3' -> 5' của gen dưới tác dụng của enzyme ARN Polymerase theo nguyên tắc bổ sung (A-U, T-A, G-X, X-G)." },
  { id: "sinh-008", subject: "sinh", topic: "Dịch mã Tổng hợp Protein", content: "Dịch mã diễn ra tại ribôxôm trong tế bào chất. tARN mang amino axit có bộ ba đối mã (anticodon) đến khớp bổ sung với bộ ba mã sao (codon) trên mARN. Mã mở đầu AUG mã hóa cho Formyl-Metionin ở sinh vật nhân sơ hoặc Metionin ở sinh vật nhân thực." },
  { id: "sinh-009", subject: "sinh", topic: "Đột biến Gen", content: "Đột biến gen là những biến đổi trong cấu trúc của gen liên quan đến một hoặc một số cặp nuclêôtit (đột biến điểm: thay thế, thêm, mất 1 cặp nuclêôtit). Đột biến mất hoặc thêm 1 cặp nuclêôtit làm dịch khung đọc mã di truyền." },
  { id: "sinh-010", subject: "sinh", topic: "Đột biến Nhiễm sắc thể", content: "Đột biến cấu trúc NST: Mất đoạn, lặp đoạn, đảo đoạn, chuyển đoạn. Đột biến số lượng NST: Lệch bội (2n+1, 2n-1) do một hoặc một số cặp NST không phân ly trong giảm phân; Đa bội (3n, 4n) do toàn bộ các cặp NST không phân ly." },
  { id: "sinh-011", subject: "sinh", topic: "Operon Lac ở Vi khuẩn E. coli", content: "Cấu trúc Operon Lac gồm: Vùng khởi động P, vùng vận hành O và các gen cấu trúc Z, Y, A. Khi không có lactozơ, protein chế tiết bám vào O ngăn cản phiên mã. Khi có lactozơ, lactozơ liên kết làm biến đổi cấu hình protein chế tiết khiến nó rời O, Operon tiến hành phiên mã." },
  { id: "sinh-012", subject: "sinh", topic: "Di truyền Liên kết và Hoán vị Gen", content: "Di truyền liên kết hoàn toàn: Các gen trên cùng 1 NST phân ly cùng nhau. Hoán vị gen xảy ra do sự tiếp hợp và trao đổi chéo giữa 2 trong 4 crômatit khác nguồn gốc của cặp NST tương đồng ở kỳ đầu giảm phân I. Tần số hoán vị gen f <= 50%." },
  { id: "sinh-013", subject: "sinh", topic: "Di truyền Liên kết Giới tính", content: "Gen nằm trên NST X không có alen tương ứng trên Y di truyền theo quy luật di truyền chéo (ông ngoại -> con gái -> cháu trai). Gen nằm trên Y không có alen trên X di truyền thẳng (100% con trai giống bố)." },
  { id: "sinh-014", subject: "sinh", topic: "Di truyền Ngoài Nhân", content: "Gen nằm trong ti thể hoặc lạp thể di truyền theo dòng mẹ. Kết quả phép lai thuận nghịch khác nhau, con lai sinh ra 100% có kiểu hình giống mẹ." },
  { id: "sinh-015", subject: "sinh", topic: "Ưu thế Lai và Tạo giống", content: "Ưu thế lai là hiện tượng cơ thể lai F1 có sức sống, năng suất cao hơn hẳn bố mẹ. Giải thích bằng giả thuyết dị hợp tử: Các alen lặn có hại bị lấn bạt bởi các alen trội có lợi ở trạng thái dị hợp." },
  { id: "sinh-016", subject: "sinh", topic: "Công nghệ Gen và ADN Tái tổ hợp", content: "Công nghệ gen là quy trình tạo ra những tế bào hoặc sinh vật có gen bị biến đổi hoặc thêm gen mới. ADN tái tổ hợp gồm thể truyền (plasmit hoặc thể thực khuẩn) gắn với gen cần chuyển nhờ enzyme cắt hạn chế (Restriction enzyme) và enzyme nối Ligase." },
  { id: "sinh-017", subject: "sinh", topic: "Bằng chứng Tiến hóa", content: "Bằng chứng sinh học tế bào và sinh học phân tử (ADN, protein) là bằng chứng trực tiếp và thuyết phục nhất chứng minh nguồn gốc chung của sinh giới. Cơ quan tương đồng có cùng nguồn gốc nhưng khác chức năng." },
  { id: "sinh-018", subject: "sinh", topic: "Thuyết Tiến hóa Hiện đại Darwin - Thuyết Tổng hợp", content: "Tiến hóa nhỏ là quá trình biến đổi tần số alen và thành phần kiểu gen của quần thể dẫn đến hình thành loài mới. Các nhân tố tiến hóa: Đột biến, di - nhập gen, chọn lọc tự nhiên, các yếu tố ngẫu nhiên, giao phối không ngẫu nhiên." },
  { id: "sinh-019", subject: "sinh", topic: "Chọn lọc Tự nhiên", content: "Chọn lọc tự nhiên tác động trực tiếp lên kiểu hình qua đó làm biến đổi tần số alen và thành phần kiểu gen của quần thể theo hướng xác định. Chọn lọc tự nhiên là nhân tố quy định chiều hướng và tốc độ tiến hóa." },
  { id: "sinh-020", subject: "sinh", topic: "Chuỗi và Lưới Thức ăn", content: "Chuỗi thức ăn gồm một dãy các loài sinh vật có quan hệ dinh dưỡng với nhau. Sinh vật sản xuất (thực vật) -> Sinh vật tiêu thụ bậc 1 (động vật ăn thực vật) -> Sinh vật tiêu thụ bậc 2 -> Sinh vật phân giải (vi khuẩn, nấm)." },
  { id: "sinh-021", subject: "sinh", topic: "Tháp Sinh thái", content: "Tháp sinh thái xây dựng dựa trên số lượng cá thể, sinh khối hoặc năng lượng ở mỗi bậc dinh dưỡng. Tháp năng lượng luôn có dạng chuẩn (bậc dinh dưỡng phía dưới luôn có năng lượng lớn hơn bậc phía trên)." },
  { id: "sinh-022", subject: "sinh", topic: "Chu trình Sinh Địa hóa Cacbon", content: "Cacbon đi vào chu trình dưới dạng CO2 thông qua quá trình quang hợp của thực vật. Cacbon trở lại môi trường qua hô hấp của sinh vật, sự phân giải của vi sinh vật và hoạt động đốt cháy nhiên liệu hóa thạch." },
  { id: "sinh-023", subject: "sinh", topic: "Di sản Sinh thái và Diễn thế Sinh thái", content: "Diễn thế sinh thái là quá trình biến đổi tuần tự của quần xã sinh vật qua các giai đoạn tương ứng với sự biến đổi của môi trường. Diễn thế nguyên sinh bắt đầu từ môi trường trống trọc dẫn đến quần xã đỉnh cực." },
  { id: "sinh-024", subject: "sinh", topic: "Hệ Sinh thái Cạn và Đầm lầy", content: "Hệ sinh thái gồm quần xã sinh vật và sinh cảnh (môi trường vô sinh). Hệ sinh thái là một hệ thống hoàn chỉnh và tương đối ổn định có sự trao đổi chất và năng lượng giữa quần xã và môi trường." },
  { id: "sinh-025", subject: "sinh", topic: "Quá trình Quang hợp C3 C4 CAM", content: "Thực vật C3 (lúa, đậu) cố định CO2 qua chu trình Calvin. Thực vật C4 (ngô, mía) cố định CO2 hai lần ở tế bào mô giậu và tế bào bao bó mạch. Thực vật CAM (xương rồng, dứa) mở khí khổng ban đêm cố định CO2 để tiết kiệm nước." }
];

const fullCorpus = [
  ...existingCorpus,
  ...chemAdditions,
  ...physAdditions,
  ...mathAdditions,
  ...bioAdditions
];

fs.writeFileSync('src/ai-training/datasets/rag-knowledge/stem-corpus.json', JSON.stringify(fullCorpus, null, 2));
console.log(`✅ [RAG Corpus] Đã mở rộng thành công lên ${fullCorpus.length} đoạn tri thức chuẩn hóa (25 đoạn/môn x 4 môn)!`);
