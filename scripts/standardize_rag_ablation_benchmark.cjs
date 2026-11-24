const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/ai-training/datasets/rag_ablation_benchmark.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const LATEX_MAP = {
  // ==================== TOÁN ====================
  HARD_TOAN_01: {
    question: "Tìm số điểm cực trị của hàm số $y = |x^3 - 3x^2 + 2|$.",
    correct_answer: "Hàm số $f(x) = x^3 - 3x^2 + 2$ có 2 điểm cực trị và có 3 nghiệm thực phân biệt. Do đó đồ thị hàm số $|f(x)|$ có tổng cộng $2 + 3 = 5$ điểm cực trị."
  },
  HARD_TOAN_02: {
    question: "Đồ thị hàm số $y = \\frac{x^2 - 1}{x - 1}$ có đường tiệm cận đứng nào không?",
    correct_answer: "Không có tiệm cận đứng vì $\\lim_{x \\to 1} y = \\lim_{x \\to 1} (x + 1) = 2$ (giới hạn hữu hạn, nghiệm mẫu số $x = 1$ bị triệt tiêu với tử số)."
  },
  HARD_TOAN_03: {
    question: "Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $f(x) + f(-x) = \\cos(x)$. Tính tích phân $I = \\int_{-\\frac{\\pi}{2}}^{\\frac{\\pi}{2}} f(x)\\,dx$.",
    correct_answer: "$I = 1$. Đổi biến $t = -x$, ta có $2I = \\int_{-\\frac{\\pi}{2}}^{\\frac{\\pi}{2}} [f(x) + f(-x)]\\,dx = \\int_{-\\frac{\\pi}{2}}^{\\frac{\\pi}{2}} \\cos(x)\\,dx = 2 \\implies I = 1$."
  },
  HARD_TOAN_04: {
    question: "Trong không gian $Oxyz$, góc $\\varphi$ giữa đường thẳng $d$ có VTCP $\\vec{u}$ và mặt phẳng $(P)$ có VTPT $\\vec{n}$ được tính qua công thức $\\sin$ hay $\\cos$?",
    correct_answer: "Tính qua công thức $\\sin$: $\\sin(\\varphi) = \\frac{|\\vec{u} \\cdot \\vec{n}|}{|\\vec{u}| \\cdot |\\vec{n}|}$ (vì góc giữa đường thẳng và mặt phẳng là góc phụ với góc giữa VTCP và VTPT)."
  },
  HARD_TOAN_05: {
    question: "Một xét nghiệm có độ nhạy $99\\%$ và độ đặc hiệu $95\\%$. Tỉ lệ mắc bệnh trong cộng đồng là $1\\%$. Một người có kết quả xét nghiệm dương tính, tính xác suất để người đó thực sự mắc bệnh.",
    correct_answer: "Xác suất thực sự mắc bệnh xấp xỉ $16{,}6\\%$ (theo định lý Bayes: $P = \\frac{0{,}01 \\times 0{,}99}{0{,}01 \\times 0{,}99 + 0{,}99 \\times 0{,}05} \\approx 0{,}166$)."
  },
  HARD_TOAN_06: {
    question: "Tính thể tích $V$ của khối tròn xoay khi quay hình phẳng giới hạn bởi $y = x^2$, $y = 4$ và $x \\ge 0$ quanh trục tung $Oy$.",
    correct_answer: "$V = \\pi \\int_{0}^{4} y\\,dy = \\pi \\left[ \\frac{y^2}{2} \\right]_0^4 = 8\\pi$."
  },
  HARD_TOAN_07: {
    question: "Viết phương trình mặt cầu tâm $I(1; 2; -1)$ tiếp xúc với mặt phẳng $(P): 2x - 2y + z - 8 = 0$.",
    correct_answer: "$(x - 1)^2 + (y - 2)^2 + (z + 1)^2 = \\frac{121}{9}$ (với bán kính $R = d(I, (P)) = \\frac{|2(1) - 2(2) + (-1) - 8|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{11}{3} \\implies R^2 = \\frac{121}{9}$)."
  },
  HARD_TOAN_08: {
    question: "Tìm tập xác định của hàm số $y = (x - 2)^{-3}$ và $y = (x - 2)^{\\frac{1}{3}}$ theo chuẩn SGK GDPT 2018.",
    correct_answer: "Với số mũ nguyên âm $-3$: $D = \\mathbb{R} \\setminus \\{2\\}$. Với số mũ không nguyên $\\frac{1}{3}$: $D = (2; +\\infty)$."
  },
  HARD_TOAN_09: {
    question: "Tìm giá trị lớn nhất của biểu thức $P = x \\cdot y$ biết $x + y = 6$ và $x, y \\ge 0$.",
    correct_answer: "$P_{\\max} = 9$ khi $x = y = 3$ (áp dụng bất đẳng thức Cauchy / AM-GM: $x \\cdot y \\le \\left(\\frac{x + y}{2}\\right)^2 = 3^2 = 9$)."
  },
  HARD_TOAN_10: {
    question: "Trong hình lập phương $ABCD.A'B'C'D'$ cạnh $a$, tính khoảng cách giữa hai đường thẳng chéo nhau $AB'$ và $CD'$.",
    correct_answer: "Khoảng cách bằng $a$ (bằng khoảng cách giữa hai mặt phẳng song song chứa hai đường thẳng là $(ABB'A')$ và $(CDD'C')$)."
  },
  HARD_TOAN_11: {
    question: "Hai biến cố $A$ và $B$ xung khắc với $P(A) > 0, P(B) > 0$ thì có thể độc lập với nhau được không?",
    correct_answer: "Không thể độc lập. Vì nếu xung khắc thì $P(AB) = 0$, trong khi nếu độc lập thì $P(AB) = P(A) \\cdot P(B) > 0$ (mâu thuẫn)."
  },
  HARD_TOAN_12: {
    question: "Mặt cầu $(S)$ bán kính $R$ cắt mặt phẳng $(P)$ theo giao tuyến là đường tròn bán kính $r$ khi nào?",
    correct_answer: "Khi khoảng cách $d$ từ tâm mặt cầu đến $(P)$ thỏa mãn $d < R$; khi đó bán kính đường tròn giao tuyến là $r = \\sqrt{R^2 - d^2}$."
  },
  HARD_TOAN_13: {
    question: "Hàm số $y = \\frac{x + 1}{x - 1}$ có đồng biến hoặc nghịch biến trên $\\mathbb{R} \\setminus \\{1\\}$ không?",
    correct_answer: "Hàm số nghịch biến trên từng khoảng $(-\\infty; 1)$ và $(1; +\\infty)$, KHÔNG được kết luận nghịch biến trên tập hợp $\\mathbb{R} \\setminus \\{1\\}$."
  },

  // ==================== VẬT LÝ ====================
  HARD_LY_01: {
    question: "Khi con lắc đơn dao động với biên độ góc $\\alpha_0 = 60^\\circ$, chu kỳ dao động có còn tính bằng công thức $T = 2\\pi\\sqrt{\\frac{l}{g}}$ không?",
    correct_answer: "Không. Công thức $T = 2\\pi\\sqrt{\\frac{l}{g}}$ chỉ đúng cho dao động điều hòa với biên độ góc nhỏ ($\\alpha_0 \\le 10^\\circ \\approx 0{,}17\\text{ rad}$). Khi $\\alpha_0 = 60^\\circ$, dao động là tuần hoàn nhưng không điều hòa, chu kỳ thực tế lớn hơn."
  },
  HARD_LY_02: {
    question: "Trong phản ứng hạt nhân, tổng khối lượng nghỉ của các hạt trước và sau phản ứng có bằng nhau không?",
    correct_answer: "Không. Tổng khối lượng nghỉ trước và sau phản ứng không bảo toàn; độ chênh lệch khối lượng $\\Delta m$ chuyển hóa thành năng lượng tỏa ra hoặc thu vào theo hệ thức Einstein: $E = \\Delta m \\cdot c^2$."
  },
  HARD_LY_03: {
    question: "Khi có lực cản môi trường đáng kể, tần số ngoại lực cưỡng bức khi biên độ đạt cực đại có bằng đúng tần số dao động riêng $f_0$ của hệ không?",
    correct_answer: "Không bằng đúng $f_0$. Khi lực cản nhỏ, tần số cộng hưởng biên độ xấp xỉ $f_0$; khi lực cản đáng kể, tần số cộng hưởng biên độ dịch về phía nhỏ hơn $f_0$."
  },
  HARD_LY_04: {
    question: "Trong thí nghiệm Y-âng với ánh sáng trắng, tại vị trí vân sáng bậc 1 của ánh sáng đỏ có thể trùng với vân sáng của ánh sáng tím không?",
    correct_answer: "Có thể. Vị trí vân sáng bậc 1 của ánh sáng đỏ ($\\lambda_1 = 0{,}76\\,\\mu\\text{m}$) trùng đúng với vân sáng bậc 2 của ánh sáng tím ($\\lambda_2 = 0{,}38\\,\\mu\\text{m}$ vì $1 \\times 0{,}76 = 2 \\times 0{,}38$)."
  },
  HARD_LY_05: {
    question: "Khi đoạn mạch xoay chiều $RLC$ có cuộn cảm thuần $L$ mắc nối tiếp tụ điện $C$ xảy ra hiện tượng cộng hưởng thì điện áp tức thời $u_L$ và $u_C$ có quan hệ thế nào?",
    correct_answer: "Hai điện áp tức thời luôn ngược pha và có biên độ bằng nhau nên triệt tiêu lẫn nhau tại mọi thời điểm: $u_L(t) + u_C(t) = 0$."
  },
  HARD_LY_06: {
    question: "Gia tốc trong dao động điều hòa đổi chiều khi vật đi qua vị trí nào?",
    correct_answer: "Gia tốc đổi chiều khi vật đi qua vị trí cân bằng ($x = 0$, vì $a = -\\omega^2 x$, vectơ gia tốc luôn hướng về vị trí cân bằng)."
  },
  HARD_LY_07: {
    question: "Trong sóng cơ lan truyền trên một phương, các phần tử môi trường có chuyển động tịnh tiến theo phương truyền sóng không?",
    correct_answer: "Không. Các phần tử môi trường chỉ dao động tại chỗ quanh vị trí cân bằng cố định của chúng, chỉ có pha dao động và năng lượng sóng được truyền đi xa."
  },
  HARD_LY_08: {
    question: "Hạt proton và electron bay vào cùng một từ trường đều với cùng vận tốc vuông góc đường sức từ thì bán kính quỹ đạo hạt nào lớn hơn?",
    correct_answer: "Bán kính của proton lớn hơn nhiều: $R = \\frac{mv}{|q|B}$. Vì $|q_p| = |q_e|$ nhưng khối lượng $m_p \\approx 1836\\,m_e$ nên $R_p \\approx 1836\\,R_e$."
  },
  HARD_LY_09: {
    question: "Một chất điểm dao động điều hòa với phương trình $x = A\\cos(\\omega t + \\varphi)$. Tính tốc độ trung bình của vật trong đúng 1 chu kỳ $T$.",
    correct_answer: "$v_{\\text{tb}} = \\frac{S}{T} = \\frac{4A}{T} = \\frac{4A}{\\frac{2\\pi}{\\omega}} = \\frac{2\\omega A}{\\pi} = \\frac{2}{\\pi}v_{\\max}$ (trong khi vận tốc trung bình bằng 0 do độ dời bằng 0)."
  },
  HARD_LY_10: {
    question: "Năng lượng kích hoạt quang điện trong ở chất bán dẫn thường lớn hơn hay nhỏ hơn công thoát electron quang điện ngoài ở kim loại?",
    correct_answer: "Nhỏ hơn rất nhiều. Hiện tượng quang điện trong chỉ cần photon vùng hồng ngoại (năng lượng từ $0{,}5\\text{ eV}$ đến $1{,}5\\text{ eV}$) để bứt electron thành electron dẫn, trong khi kim loại cần photon tử ngoại / ánh sáng khả kiến (năng lượng từ $2\\text{ eV}$ đến vài $\\text{eV}$)."
  },
  HARD_LY_11: {
    question: "Một thanh kim loại dài $l$ chuyển động với vận tốc $\\vec{v}$ song song với các đường sức từ của từ trường đều $\\vec{B}$. Suất điện động cảm ứng trong thanh bằng bao nhiêu?",
    correct_answer: "Bằng 0 vì vectơ vận tốc song song với vectơ cảm ứng từ (góc $\\alpha = 0^\\circ \\implies e_{\\text{cư}} = B l v \\sin(\\alpha) = 0$)."
  },
  HARD_LY_12: {
    question: "Chu kỳ dao động của con lắc lò xo có bị thay đổi khi đưa con lắc lên đỉnh núi cao hoặc đưa lên Mặt Trăng không?",
    correct_answer: "Không thay đổi. Vì chu kỳ $T = 2\\pi\\sqrt{\\frac{m}{k}}$ chỉ phụ thuộc vào khối lượng $m$ và độ cứng $k$ của lò xo, không phụ thuộc vào gia tốc trọng trường $g$."
  },

  // ==================== HÓA HỌC ====================
  HARD_HOA_01: {
    question: "Cho kim loại nhôm vào dung dịch kiềm $\\text{NaOH}$, chất nào đóng vai trò là chất oxi hóa trực tiếp tạo khí $\\text{H}_2$?",
    correct_answer: "Nước $(\\text{H}_2\\text{O})$ là chất oxi hóa trực tiếp: $2\\text{Al} + 2\\text{OH}^- + 6\\text{H}_2\\text{O} \\longrightarrow 2[\\text{Al(OH)}_4]^- + 3\\text{H}_2\\uparrow$ (trong đó $\\text{H}^{+1}$ của $\\text{H}_2\\text{O}$ nhận electron trở thành $\\text{H}_2^0$)."
  },
  HARD_HOA_02: {
    question: "Dung dịch muối $\\text{Fe(NO}_3)_2$ có phản ứng được với dung dịch $\\text{HCl}$ loãng không? Viết phương trình ion thu gọn nếu có.",
    correct_answer: "Có phản ứng xảy ra do sự kết hợp của $\\text{Fe}^{2+}$, $\\text{H}^+$ và $\\text{NO}_3^-$ có tính oxi hóa mạnh: $3\\text{Fe}^{2+} + 4\\text{H}^+ + \\text{NO}_3^- \\longrightarrow 3\\text{Fe}^{3+} + \\text{NO}\\uparrow + 2\\text{H}_2\\text{O}$."
  },
  HARD_HOA_03: {
    question: "Khi sục khí $\\text{CO}_2$ dư vào dung dịch muối natri aluminat theo chuẩn SGK GDPT 2018 thì có kết tủa không và kết tủa có bị hòa tan không?",
    correct_answer: "Xuất hiện kết tủa keo trắng $\\text{Al(OH)}_3$ và kết tủa KHÔNG bị hòa tan dù $\\text{CO}_2$ dư: $[\\text{Al(OH)}_4]^- + \\text{CO}_2 \\longrightarrow \\text{Al(OH)}_3\\downarrow + \\text{HCO}_3^-$."
  },
  HARD_HOA_04: {
    question: "Tại sao etylamin $(\\text{CH}_3\\text{CH}_2\\text{NH}_2)$ có lực bazơ mạnh hơn amoniac $(\\text{NH}_3)$, nhưng anilin $(\\text{C}_6\\text{H}_5\\text{NH}_2)$ lại yếu hơn amoniac?",
    correct_answer: "Gốc etyl $-\\text{C}_2\\text{H}_5$ đẩy electron làm tăng mật độ electron trên nguyên tử $\\text{N}$, tăng khả năng nhận proton $\\text{H}^+$. Ngược lại, gốc phenyl $-\\text{C}_6\\text{H}_5$ hút electron do hiệu ứng liên hợp làm giảm mật độ electron trên nguyên tử $\\text{N}$."
  },
  HARD_HOA_05: {
    question: "Phản ứng este hóa giữa axit axetic và ancol etylic có phải là phản ứng một chiều hoàn toàn không? Làm sao để tăng hiệu suất?",
    correct_answer: "Là phản ứng thuận nghịch hai chiều: $\\text{CH}_3\\text{COOH} + \\text{C}_2\\text{H}_5\\text{OH} \\stackrel{\\text{H}_2\\text{SO}_4\\text{ đặc},\\,t^\\circ}{\\rightleftharpoons} \\text{CH}_3\\text{COOC}_2\\text{H}_5 + \\text{H}_2\\text{O}$. Để tăng hiệu suất: dùng dư một trong hai chất đầu, dùng $\\text{H}_2\\text{SO}_4$ đặc hút nước, hoặc chưng cất tách este ra khỏi hỗn hợp."
  },
  HARD_HOA_06: {
    question: "Số liên kết peptit trong một phân tử tetrapeptit mạch hở là bao nhiêu?",
    correct_answer: "Có đúng 3 liên kết peptit (phân tử tạo bởi 4 gốc $\\alpha$-amino axit có $4 - 1 = 3$ liên kết $-\\text{CO}-\\text{NH}-$)."
  },
  HARD_HOA_07: {
    question: "Khi tăng áp suất chung của hệ cân bằng: $\\text{H}_2\\text{(k)} + \\text{I}_2\\text{(k)} \\rightleftharpoons 2\\text{HI}\\text{(k)}$ ở nhiệt độ không đổi thì cân bằng chuyển dịch theo chiều nào?",
    correct_answer: "Cân bằng không chuyển dịch vì tổng số mol khí ở hai vế của phương trình phản ứng bằng nhau ($1 + 1 = 2$)."
  },
  HARD_HOA_08: {
    question: "Trong các cacbohiđrat: glucozơ, fructozơ, saccarozơ, tinh bột, xenlulozơ; chất nào có phản ứng tráng bạc?",
    correct_answer: "Glucozơ và Fructozơ có phản ứng tráng bạc (Fructozơ đồng phân hóa thành Glucozơ trong môi trường kiềm của dung dịch amoniac). Saccarozơ, tinh bột và xenlulozơ không tráng bạc."
  },
  HARD_HOA_09: {
    question: "Để xảy ra hiện tượng ăn mòn điện hóa học kim loại cần thỏa mãn đồng thời mấy điều kiện?",
    correct_answer: "3 điều kiện đồng thời: 1) Hai điện cực khác chất; 2) Hai điện cực tiếp xúc trực tiếp hoặc gián tiếp qua dây dẫn; 3) Cùng tiếp xúc với một dung dịch chất điện ly."
  },
  HARD_HOA_10: {
    question: "Viết cấu hình electron của ion $\\text{Fe}^{2+}$ ($Z = 26$).",
    correct_answer: "$1s^2\\,2s^2\\,2p^6\\,3s^2\\,3p^6\\,3d^6$ (viết gọn là $[\\text{Ar}]\\,3d^6$, do nguyên tử sắt nhường 2 electron ở phân lớp ngoài cùng $4s^2$)."
  },
  HARD_HOA_11: {
    question: "Thủy phân phenyl axetat $(\\text{CH}_3\\text{COOC}_6\\text{H}_5)$ trong dung dịch $\\text{NaOH}$ dư đun nóng thu được những sản phẩm gì?",
    correct_answer: "Thu được 2 muối gồm natri axetat $\\text{CH}_3\\text{COONa}$, natri phenolat $\\text{C}_6\\text{H}_5\\text{ONa}$ và nước $\\text{H}_2\\text{O}$ (không tạo ra ancol vì phenol sinh ra phản ứng tiếp với $\\text{NaOH}$)."
  },
  HARD_HOA_12: {
    question: "Khí chính gây ra hiện tượng hiệu ứng nhà kính và nhóm chất chính phá hủy tầng ozon theo SGK GDPT 2018 là những chất nào?",
    correct_answer: "Khí chính gây hiệu ứng nhà kính là $\\text{CO}_2$ (và $\\text{CH}_4$); nhóm chất chính phá hủy tầng ozon là hợp chất $\\text{CFC}$ (chlorofluorocarbon)."
  },

  // ==================== SINH HỌC ====================
  HARD_SINH_01: {
    question: "Một đột biến điểm thay thế cặp $\\text{A}-\\text{T}$ bằng cặp $\\text{G}-\\text{X}$ tại vị trí nuclêôtit đầu tiên của codon mở đầu $\\text{5'AUG3'}$ trên $\\text{mARN}$ sẽ dẫn tới hậu quả gì?",
    correct_answer: "Codon mở đầu bị biến đổi thành $\\text{5'GUG3'}$, làm cho quá trình dịch mã không được khởi đầu hoặc chuỗi polipeptit không được tổng hợp bình thường."
  },
  HARD_SINH_02: {
    question: "Vì sao tần số hoán vị gen giữa hai locus trên cùng một nhiễm sắc thể không bao giờ vượt quá $50\\%$?",
    correct_answer: "Vì hiện tượng trao đổi chéo chỉ xảy ra giữa 2 trong 4 sợi cromatit khác nguồn gốc của cặp nhiễm sắc thể tương đồng ở kì đầu giảm phân $I$, tối đa $50\\%$ số giao tử sinh ra mang gen hoán vị."
  },
  HARD_SINH_03: {
    question: "Khi môi trường có đường lactozơ, phân tử allolactozơ liên kết với protein ức chế gây ra hiện tượng gì trong $\\text{Operon Lac}$?",
    correct_answer: "Allolactozơ liên kết làm biến đổi cấu hình không gian của protein ức chế, khiến nó bị bất hoạt và không thể gắn vào vùng vận hành $O$, giải phóng để enzim $\\text{ARN polimeraza}$ phiên mã các gen cấu trúc $Z, Y, A$."
  },
  HARD_SINH_04: {
    question: "Đột biến thêm 1 cặp nuclêôtit hay đột biến thêm 3 cặp nuclêôtit tại một vị trí trong vùng mã hóa gây hậu quả nghiêm trọng hơn cho cấu trúc chuỗi polipeptit?",
    correct_answer: "Thêm 1 cặp nuclêôtit gây hậu quả nghiêm trọng hơn vì gây đột biến dịch khung đọc mã di truyền (frameshift mutation), làm thay đổi toàn bộ trình tự axit amin từ vị trí đột biến cho đến cuối chuỗi."
  },
  HARD_SINH_05: {
    question: "Một quần thể có cấu trúc di truyền: $0{,}04\\text{AA} + 0{,}32\\text{Aa} + 0{,}64\\text{aa} = 1$. Quần thể này đã đạt trạng thái cân bằng di truyền Hardy - Weinberg chưa?",
    correct_answer: "Đã đạt trạng thái cân bằng di truyền vì cấu trúc thỏa mãn đẳng thức $p^2\\text{AA} + 2pq\\text{Aa} + q^2\\text{aa} = 1$ với tần số alen $p(A) = \\sqrt{0{,}04} = 0{,}2$ và $q(a) = \\sqrt{0{,}64} = 0{,}8$ (thỏa mãn $2pq = 2(0{,}2)(0{,}8) = 0{,}32$)."
  },
  HARD_SINH_06: {
    question: "Ở kì sau của nguyên phân và kì sau $I$ của giảm phân, số lượng crômatit trong mỗi tế bào lần lượt là bao nhiêu ở loài có bộ NST $2n = 8$?",
    correct_answer: "Kì sau nguyên phân có 0 crômatit (vì các tâm động đã tách đôi, 8 NST kép chuyển thành 16 NST đơn). Kì sau $I$ giảm phân có 16 crômatit (gồm 8 NST kép đang phân ly về 2 cực)."
  },
  HARD_SINH_07: {
    question: "Bệnh mù màu do alen lặn trên vùng không tương đồng của nhiễm sắc thể $X$ quy định. Bố bình thường ($X^M Y$), mẹ mang gen bệnh ($X^M X^m$). Xác định xác suất sinh con trai mắc bệnh.",
    correct_answer: "Xác suất sinh được một con trai bị bệnh mù màu là $25\\%$ ($X^m Y$ chiếm $\\frac{1}{4}$ tổng số con sinh ra). Nếu đã biết đứa con sinh ra là con trai, xác suất con trai đó bị bệnh là $50\\%$."
  },
  HARD_SINH_08: {
    question: "Trong pha sáng của quá trình quang hợp ở thực vật, khí oxy ($\\text{O}_2$) giải phóng ra có nguồn gốc từ phân tử nào?",
    correct_answer: "Giải phóng từ quá trình quang phân ly nước ($\\text{H}_2\\text{O} \\longrightarrow 2\\text{H}^+ + 2e^- + \\frac{1}{2}\\text{O}_2\\uparrow$) xảy ra tại xoang tilacôit của lục lạp."
  },
  HARD_SINH_09: {
    question: "Nhân tố tiến hóa nào có thể loại bỏ hoàn toàn một alen có lợi ra khỏi quần thể chỉ sau một thế hệ?",
    correct_answer: "Các yếu tố ngẫu nhiên (phiêu bạt di truyền / genetic drift, ví dụ: thiên tai, dịch bệnh, cháy rừng)."
  },
  HARD_SINH_10: {
    question: "Nêu đặc điểm cơ bản để nhận biết hiện tượng di truyền tế bào chất (di truyền theo dòng mẹ).",
    correct_answer: "Mọi con lai sinh ra ở đời sau đều có kiểu hình giống cơ thể mẹ; kết quả phép lai thuận và phép lai nghịch cho kết quả khác nhau."
  },
  HARD_SINH_11: {
    question: "Cấu trúc bậc mấy của phân tử prôtêin được giữ vững chủ yếu bởi liên kết cộng hóa trị peptit?",
    correct_answer: "Cấu trúc bậc 1 (trình tự sắp xếp tuyến tính của các axit amin trong chuỗi polipeptit được liên kết với nhau bằng liên kết peptit)."
  },
  HARD_SINH_12: {
    question: "Đặc tính nào của mã di truyền giải thích vì sao nhiều codon khác nhau cùng mã hóa cho một loại axit amin?",
    correct_answer: "Tính thoái hóa (dư thừa) của mã di truyền (trừ hai codon $\\text{5'AUG3'}$ và $\\text{5'UGG3'}$ chỉ mã hóa cho một axit amin duy nhất)."
  }
};

let count = 0;
data.hard_trap_gdpt2018.forEach(item => {
  const p = LATEX_MAP[item.id];
  if (p) {
    if (p.question) item.question = p.question;
    if (p.correct_answer) item.correct_answer = p.correct_answer;
    count++;
  }
});

console.log(`Đã cập nhật ${count} câu hỏi bẫy trong rag_ablation_benchmark.json sang chuẩn LaTeX!`);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

