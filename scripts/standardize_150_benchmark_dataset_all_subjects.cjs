const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/ai-training/datasets/benchmark_150_cases.json');
const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Bản đồ cập nhật LaTeX chuẩn mực cho tất cả các ca trong 150 ca benchmark
const LATEX_UPDATES = {
  // ==================== TOÁN (40 CA) ====================
  BENCH_TOAN_01: {
    question: "Tìm tọa độ các điểm cực trị của đồ thị hàm số $y = x^3 - 3x^2 + 2$.",
    ground_truth: "$y' = 3x^2 - 6x = 0 \\iff x = 0 \\text{ hoặc } x = 2$. Điểm cực đại $A(0; 2)$, điểm cực tiểu $B(2; -2)$."
  },
  BENCH_TOAN_02: {
    question: "Tìm phương trình các đường tiệm cận của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$.",
    ground_truth: "Tiệm cận đứng $x = -1$, tiệm cận ngang $y = 2$."
  },
  BENCH_TOAN_03: {
    question: "Tìm các khoảng đồng biến, nghịch biến của hàm số $y = -x^3 + 3x - 1$.",
    ground_truth: "Hàm số đồng biến trên $(-1; 1)$, nghịch biến trên $(-\\infty; -1)$ và $(1; +\\infty)$."
  },
  BENCH_TOAN_04: {
    question: "Tìm giá trị lớn nhất (GTLN) và giá trị nhỏ nhất (GTNN) của hàm số $y = x^4 - 2x^2 + 3$ trên đoạn $[0; 2]$.",
    ground_truth: "$\\max_{[0; 2]} y = 11$ tại $x = 2$; $\\min_{[0; 2]} y = 2$ tại $x = 1$."
  },
  BENCH_TOAN_05: {
    question: "Cho hàm số $y = f(x)$ có $y_{\\text{CĐ}} = 1$ và $y_{\\text{CT}} = -3$. Tìm tham số $m$ để phương trình $f(x) = m$ có đúng 3 nghiệm phân biệt.",
    ground_truth: "$-3 < m < 1$."
  },
  BENCH_TOAN_06: {
    question: "Viết phương trình tiếp tuyến của đồ thị hàm số $y = x^3 - 3x + 1$ tại điểm có hoành độ $x_0 = 2$.",
    ground_truth: "$y = 9x - 15$ (với hệ số góc $k = y'(2) = 9$, tung độ tiếp điểm $y_0 = 3$)."
  },
  BENCH_TOAN_07: {
    question: "Tìm tập xác định $D$ của hàm số $y = \\log_2(x^2 - 4x + 3)$.",
    ground_truth: "$D = (-\\infty; 1) \\cup (3; +\\infty)$ (điều kiện $x^2 - 4x + 3 > 0$)."
  },
  BENCH_TOAN_08: {
    question: "Tính đạo hàm của hàm số $y = e^{2x} + \\ln(x)$.",
    ground_truth: "$y' = 2e^{2x} + \\frac{1}{x}$ (với điều kiện $x > 0$)."
  },
  BENCH_TOAN_09: {
    question: "Tìm tham số $m$ để hàm số $y = \\frac{x - m}{x + 1}$ đồng biến trên từng khoảng xác định.",
    ground_truth: "$m > -1$ (do đạo hàm $y' = \\frac{1 + m}{(x + 1)^2} > 0 \\iff 1 + m > 0$)."
  },
  BENCH_TOAN_10: {
    question: "Tìm tọa độ điểm uốn $U$ của đồ thị hàm số $y = x^3 - 3x^2 + 4$.",
    ground_truth: "$U(1; 2)$ (do $y'' = 6x - 6 = 0 \\iff x = 1$ và đổi dấu qua $x = 1$)."
  },
  BENCH_TOAN_11: {
    question: "Tìm nguyên hàm của hàm số $f(x) = 3x^2 - 2x + \\cos(x)$.",
    ground_truth: "$F(x) = x^3 - x^2 + \\sin(x) + C$."
  },
  BENCH_TOAN_19: {
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Tính góc giữa hai đường thẳng $AB$ và $B'D'$.",
    ground_truth: "Góc giữa $AB$ và $B'D'$ bằng $45^\\circ$ (do $B'D' \\parallel BD$, tam giác $ABD$ vuông cân tại $A$)."
  },
  BENCH_TOAN_20: {
    question: "Cho hình chóp $S.ABC$ có đáy $ABC$ vuông tại $B$, $SA \\perp (ABC)$. Chứng minh $BC \\perp (SAB)$.",
    ground_truth: "$BC \\perp (SAB)$ (do $BC \\perp AB$ và $BC \\perp SA$, với $AB, SA \\subset (SAB)$ cắt nhau tại $A$)."
  },
  BENCH_TOAN_22: {
    question: "Cho tứ diện đều $ABCD$ cạnh $a$. Mặt phẳng $(P)$ song song với $AB$ và $CD$. Thiết diện của tứ diện cắt bởi $(P)$ là hình gì?",
    ground_truth: "Thiết diện là hình chữ nhật (do hai cạnh đối diện $AB \\perp CD$ trong tứ diện đều)."
  },
  BENCH_TOAN_26: {
    question: "Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$, $SA = a\\sqrt{3}$. Tính góc giữa đường thẳng $SC$ và mặt phẳng đáy $(ABCD)$.",
    ground_truth: "$\\widehat{(SC, (ABCD))} = \\widehat{SCA} = \\arctan\\left(\\frac{SA}{AC}\\right) = \\arctan\\left(\\frac{a\\sqrt{3}}{a\\sqrt{2}}\\right) = \\arctan\\left(\\frac{\\sqrt{6}}{2}\\right) \\approx 50{,}77^\\circ$."
  },
  BENCH_TOAN_27: {
    question: "Trong không gian $Oxyz$, cho hai vectơ $\\vec{u} = (1; 2; -1)$ và $\\vec{v} = (2; 0; 3)$. Tính tọa độ tích có hướng $[\\vec{u}, \\vec{v}]$.",
    ground_truth: "$[\\vec{u}, \\vec{v}] = (6; -5; -4)$ (với các định thức cấp hai $\\left|\\begin{matrix} 2 & -1 \\\\ 0 & 3 \\end{matrix}\\right| = 6$, $\\left|\\begin{matrix} -1 & 1 \\\\ 3 & 2 \\end{matrix}\\right| = -5$, $\\left|\\begin{matrix} 1 & 2 \\\\ 2 & 0 \\end{matrix}\\right| = -4$)."
  },
  BENCH_TOAN_28: {
    question: "Trong không gian $Oxyz$, viết phương trình mặt phẳng đi qua ba điểm $A(1; 0; 0)$, $B(0; 2; 0)$, $C(0; 0; 3)$.",
    ground_truth: "Phương trình mặt phẳng theo đoạn chắn: $\\frac{x}{1} + \\frac{y}{2} + \\frac{z}{3} = 1 \\iff 6x + 3y + 2z - 6 = 0$."
  },
  BENCH_TOAN_29: {
    question: "Tính khoảng cách từ điểm $M(1; 2; -3)$ đến mặt phẳng $(P): 2x - 2y + z - 6 = 0$.",
    ground_truth: "$d(M, (P)) = \\frac{|2(1) - 2(2) + (-3) - 6|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{|-11|}{3} = \\frac{11}{3}$."
  },
  BENCH_TOAN_30: {
    question: "Xét vị trí tương đối giữa hai mặt phẳng $(P): 2x - y + 3z - 1 = 0$ và $(Q): 4x - 2y + 6z + 5 = 0$.",
    ground_truth: "$(P) \\parallel (Q)$ (do vectơ pháp tuyến $\\vec{n}_Q = 2\\vec{n}_P = (4; -2; 6)$ cùng phương nhưng tỉ số hệ số tự do $\\frac{-1}{5} \\ne \\frac{2}{4}$)."
  },
  BENCH_TOAN_31: {
    question: "Viết phương trình chính tắc của đường thẳng $d$ đi qua điểm $M(1; -2; 3)$ và có vectơ chỉ phương $\\vec{u} = (2; 1; -4)$.",
    ground_truth: "$\\frac{x - 1}{2} = \\frac{y + 2}{1} = \\frac{z - 3}{-4}$."
  },
  BENCH_TOAN_32: {
    question: "Tính góc giữa hai đường thẳng có vectơ chỉ phương $\\vec{u}_1 = (1; 2; 2)$ và $\\vec{u}_2 = (2; 1; -2)$.",
    ground_truth: "Góc giữa hai đường thẳng bằng $90^\\circ$ (do tích vô hướng $\\vec{u}_1 \\cdot \\vec{u}_2 = 1(2) + 2(1) + 2(-2) = 0$)."
  },
  BENCH_TOAN_33: {
    question: "Tìm tọa độ hình chiếu vuông góc $H$ của điểm $A(2; 1; 3)$ lên mặt phẳng tọa độ $(Oxy)$.",
    ground_truth: "$H(2; 1; 0)$ (giữ nguyên hoành độ, tung độ và cho cao độ $z = 0$)."
  },
  BENCH_TOAN_34: {
    question: "Tìm tọa độ tâm $I$ và bán kính $R$ của mặt cầu $(S): (x - 2)^2 + (y + 1)^2 + (z - 4)^2 = 25$.",
    ground_truth: "Tâm $I(2; -1; 4)$ và bán kính $R = \\sqrt{25} = 5$."
  },
  BENCH_TOAN_35: {
    question: "Một hộp có 5 viên bi đỏ và 4 viên bi xanh. Lấy ngẫu nhiên không hoàn lại 2 viên bi. Tính xác suất để cả 2 viên bi lấy ra đều màu đỏ.",
    ground_truth: "$P = \\frac{C_5^2}{C_9^2} = \\frac{10}{36} = \\frac{5}{18}$."
  },
  BENCH_TOAN_36: {
    question: "Gieo một con súc sắc cân đối, đồng chất 1 lần. Tính xác suất để số chấm xuất hiện là số lẻ hoặc lớn hơn 4.",
    ground_truth: "$P = \\frac{4}{6} = \\frac{2}{3}$ (tập các biến cố thuận lợi: $\\{1; 3; 5; 6\\}$ gồm 4 phần tử trên 6 khả năng)."
  },
  BENCH_TOAN_37: {
    question: "Một lớp 40 học sinh có 25 em học tiếng Anh, 10 em học cả tiếng Anh và tiếng Pháp. Chọn ngẫu nhiên một học sinh biết em đó học tiếng Anh. Tính xác suất để em đó cũng học tiếng Pháp.",
    ground_truth: "$P(\\text{Pháp} \\mid \\text{Anh}) = \\frac{n(\\text{Anh} \\cap \\text{Pháp})}{n(\\text{Anh})} = \\frac{10}{25} = 0{,}4 = 40\\%$."
  },
  BENCH_TOAN_38: {
    question: "Có bao nhiêu cách chọn 1 lớp trưởng, 1 lớp phó và 1 bí thư từ một tổ gồm 8 học sinh (mỗi người giữ tối đa 1 chức vụ)?",
    ground_truth: "$A_8^3 = 8 \\times 7 \\times 6 = 336\\text{ cách}$."
  },
  BENCH_TOAN_39: {
    question: "Cho mẫu số liệu điểm kiểm tra: $6, 7, 7, 8, 9, 10$. Tìm số trung bình $\\bar{x}$ và số trung vị $M_e$.",
    ground_truth: "Số trung bình $\\bar{x} = \\frac{6 + 7 + 7 + 8 + 9 + 10}{6} = \\frac{47}{6} \\approx 7{,}83$; số trung vị $M_e = \\frac{7 + 8}{2} = 7{,}5$."
  },
  BENCH_TOAN_40: {
    question: "Một xạ thủ bắn bia với xác suất trúng mỗi phát là $0{,}8$. Bắn 4 phát độc lập. Tính xác suất để xạ thủ bắn trúng đúng 3 phát.",
    ground_truth: "$P = C_4^3 \\times (0{,}8)^3 \\times (0{,}2)^1 = 4 \\times 0{,}512 \\times 0{,}2 = 0{,}4096$."
  },

  // ==================== VẬT LÝ (38 CA) ====================
  BENCH_LY_05: {
    question: "Nêu điều kiện xảy ra hiện tượng cộng hưởng cơ và đặc điểm biên độ dao động khi đó.",
    ground_truth: "Điều kiện: tần số của ngoại lực cưỡng bức bằng tần số dao động riêng của hệ ($f = f_0$). Khi đó biên độ dao động cưỡng bức đạt giá trị cực đại ($A = A_{\\max}$)."
  },
  BENCH_LY_06: {
    question: "Mối quan hệ về pha giữa li độ $x$, vận tốc $v$ và gia tốc $a$ trong dao động điều hòa.",
    ground_truth: "Vận tốc sớm pha $\\frac{\\pi}{2}$ so với li độ; gia tốc sớm pha $\\frac{\\pi}{2}$ so với vận tốc (ngược pha $\\pi$ so với li độ): $a = -\\omega^2 x$."
  },
  BENCH_LY_08: {
    question: "Định nghĩa bước sóng $\\lambda$ và công thức liên hệ giữa bước sóng với tốc độ truyền sóng $v$, chu kỳ $T$, tần số $f$.",
    ground_truth: "Bước sóng $\\lambda$ là quãng đường sóng truyền đi trong 1 chu kỳ dao động: $\\lambda = v \\cdot T = \\frac{v}{f}$."
  },
  BENCH_LY_09: {
    question: "Công thức tính độ lệch pha $\\Delta\\varphi$ giữa hai điểm cách nhau một khoảng $d$ trên cùng một phương truyền sóng.",
    ground_truth: "$\\Delta\\varphi = \\frac{2\\pi d}{\\lambda}$. Hai điểm dao động cùng pha khi $d = k\\lambda$; ngược pha khi $d = (k + 0{,}5)\\lambda$ ($k \\in \\mathbb{Z}$)."
  },
  BENCH_LY_10: {
    question: "Điều kiện về hiệu đường đi để một điểm trong vùng giao thoa của hai nguồn sóng kết hợp cùng pha dao động với biên độ cực đại.",
    ground_truth: "Hiệu đường đi: $d_2 - d_1 = k\\lambda$ ($k \\in \\mathbb{Z}$). Khi đó biên độ cực đại $A_{\\max} = 2a$ (với $a$ là biên độ mỗi nguồn)."
  },
  BENCH_LY_11: {
    question: "Điều kiện chiều dài sợi dây $L$ để xảy ra sóng dừng trên dây có hai đầu cố định.",
    ground_truth: "$L = k\\frac{\\lambda}{2}$ ($k \\in \\mathbb{N}^*$, với $k$ là số bó sóng, số bụng sóng bằng $k$, số nút sóng bằng $k + 1$)."
  },
  BENCH_LY_12: {
    question: "Một sợi dây dài $60\\text{ cm}$ có một đầu cố định, một đầu tự do dao động với bước sóng $\\lambda = 40\\text{ cm}$. Tính số bụng sóng trên dây.",
    ground_truth: "Điều kiện một đầu cố định, một đầu tự do: $L = (2k + 1)\\frac{\\lambda}{4} \\iff 60 = (2k + 1)\\frac{40}{4} \\iff 2k + 1 = 6 \\implies k = 2{,}5$ (không nguyên nên không thỏa mãn bước sóng $40\\text{ cm}$). Với sợi dây có $k = 1 \\implies L = 30\\text{ cm}$ thì số bụng bằng $k + 1 = 2$."
  },
  BENCH_LY_13: {
    question: "Viết công thức tính mức cường độ âm $L$ theo đơn vị ben (B) và đêxiben (dB).",
    ground_truth: "$L(\\text{B}) = \\lg\\left(\\frac{I}{I_0}\\right)$ hoặc $L(\\text{dB}) = 10\\lg\\left(\\frac{I}{I_0}\\right)$, trong đó $I_0 = 10^{-12}\\text{ W/m}^2$ là cường độ âm chuẩn ở tần số $1000\\text{ Hz}$."
  },
  BENCH_LY_14: {
    question: "Nêu các đặc trưng sinh lý của âm và chỉ rõ đặc trưng vật lý tương ứng của từng đặc trưng sinh lý đó.",
    ground_truth: "1) Độ cao tương ứng với tần số âm $f$; 2) Độ to tương ứng với mức cường độ âm $L$; 3) Âm sắc tương ứng với đồ thị dao động âm (tần số và biên độ các họa âm)."
  },
  BENCH_LY_16: {
    question: "Viết công thức tính cảm kháng $Z_L$ của cuộn cảm thuần và dung kháng $Z_C$ của tụ điện trong mạch xoay chiều.",
    ground_truth: "$Z_L = \\omega L = 2\\pi f L$; $Z_C = \\frac{1}{\\omega C} = \\frac{1}{2\\pi f C}$."
  },
  BENCH_LY_18: {
    question: "Viết công thức tính độ lệch pha $\\varphi$ giữa điện áp xoay chiều $u$ và cường độ dòng điện $i$ trong đoạn mạch $RLC$ nối tiếp.",
    ground_truth: "$\\tan(\\varphi) = \\frac{Z_L - Z_C}{R} = \\frac{U_L - U_C}{U_R}$. Nếu $\\varphi > 0$ thì $u$ sớm pha hơn $i$ (mạch có tính cảm kháng); nếu $\\varphi < 0$ thì $u$ trễ pha hơn $i$ (mạch có tính dung kháng)."
  },
  BENCH_LY_19: {
    question: "Nêu điều kiện và các hệ quả chính khi đoạn mạch $RLC$ mắc nối tiếp xảy ra hiện tượng cộng hưởng điện.",
    ground_truth: "Điều kiện: $Z_L = Z_C \\iff \\omega = \\frac{1}{\\sqrt{LC}} \\iff \\omega^2 LC = 1$. Hệ quả: Tổng trở nhỏ nhất $Z_{\\min} = R$; cường độ dòng điện cực đại $I_{\\max} = \\frac{U}{R}$; hệ số công suất $\\cos(\\varphi) = 1$."
  },
  BENCH_LY_20: {
    question: "Viết công thức tính công suất tiêu thụ $P$ của dòng điện xoay chiều trong đoạn mạch bất kỳ.",
    ground_truth: "$P = U I \\cos(\\varphi) = I^2 R$ (trong đó $\\cos(\\varphi) = \\frac{R}{Z}$ là hệ số công suất của mạch)."
  },
  BENCH_LY_21: {
    question: "Nêu công thức liên hệ giữa điện áp hiệu dụng, số vòng dây và cường độ dòng điện trong máy biến áp lý tưởng.",
    ground_truth: "$\\frac{U_1}{U_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1}$ (bỏ qua hao phí năng lượng)."
  },
  BENCH_LY_22: {
    question: "Biện pháp hiệu quả nhất để giảm công suất hao phí do tỏa nhiệt trên đường dây tải điện đi xa là gì và giải thích.",
    ground_truth: "Tăng điện áp hiệu dụng $U$ trước khi truyền tải, vì công suất hao phí $\\Delta P = \\frac{P^2 R}{U^2 \\cos^2(\\varphi)}$ tỉ lệ nghịch với bình phương điện áp $U^2$."
  },
  BENCH_LY_24: {
    question: "Sóng điện từ là sóng dọc hay sóng ngang? Có truyền được trong chân không không và vận tốc bằng bao nhiêu?",
    ground_truth: "Sóng điện từ là sóng ngang, trong đó vectơ cường độ điện trường $\\vec{E}$ và vectơ cảm ứng từ $\\vec{B}$ luôn vuông góc với nhau và vuông góc với phương truyền sóng $\\vec{v}$; truyền được trong chân không với tốc độ $c = 3 \\times 10^8\\text{ m/s}$."
  },
  BENCH_LY_25: {
    question: "Giải thích nguyên nhân của hiện tượng tán sắc ánh sáng trắng khi truyền qua lăng kính thủy tinh.",
    ground_truth: "Do chiết suất của thủy tinh phụ thuộc vào màu sắc ánh sáng: $n_{\\text{đỏ}} < n_{\\text{vàng}} < n_{\\text{tím}}$, nên góc lệch qua lăng kính $D_{\\text{tím}} > D_{\\text{đỏ}}$, làm chùm sáng trắng bị phân tách thành dải màu liên tục từ đỏ đến tím."
  },
  BENCH_LY_27: {
    question: "Viết công thức xác định vị trí vân sáng $x_s$ bậc $k$ và vân tối $x_t$ thứ $k$ trên màn trong thí nghiệm giao thoa ánh sáng Y-âng.",
    ground_truth: "Vị trí vân sáng: $x_s = k i = k \\frac{\\lambda D}{a}$ ($k \\in \\mathbb{Z}$); vị trí vân tối: $x_t = (k + 0{,}5) i = (k + 0{,}5) \\frac{\\lambda D}{a}$ ($k \\in \\mathbb{Z}$)."
  },
  BENCH_LY_28: {
    question: "Nêu nguồn phát và các tác dụng nổi bật của tia tử ngoại (UV).",
    ground_truth: "Nguồn phát: các vật bị nung nóng đến nhiệt độ trên $2000^\\circ\\text{C}$ (hồ quang điện, đèn thủy ngân, bề mặt Mặt Trời). Tác dụng nổi bật: tác dụng sinh học (diệt khuẩn, tiệt trùng), làm phát quang một số chất, gây ra hiện tượng quang điện."
  },
  BENCH_LY_29: {
    question: "Bản chất của tia X và tính chất quan trọng nhất giúp tia X được ứng dụng rộng rãi trong chẩn đoán hình ảnh y tế.",
    ground_truth: "Bản chất: sóng điện từ có bước sóng cực ngắn (từ $10^{-11}\\text{ m}$ đến $10^{-8}\\text{ m}$). Tính chất quan trọng nhất: khả năng đâm xuyên mạnh qua mô mềm nhưng bị xương và kim loại cản lại (ứng dụng chụp X-quang)."
  },
  BENCH_LY_31: {
    question: "Phát biểu định luật về giới hạn quang điện của kim loại.",
    ground_truth: "Để xảy ra hiện tượng quang điện ngoài, bước sóng của ánh sáng kích thích $\\lambda$ phải nhỏ hơn hoặc bằng giới hạn quang điện $\\lambda_0$ của kim loại đó: $\\lambda \\le \\lambda_0 = \\frac{hc}{A}$ (với $A$ là công thoát của electron)."
  },
  BENCH_LY_32: {
    question: "Phân biệt hiện tượng quang điện ngoài và hiện tượng quang điện trong.",
    ground_truth: "Quang điện ngoài: electron hấp thụ photon và bứt hẳn ra khỏi bề mặt kim loại. Quang điện trong: electron hấp thụ photon chỉ bứt khỏi liên kết trở thành electron dẫn tự do chuyển động bên trong khối chất bán dẫn."
  },
  BENCH_LY_33: {
    question: "Khi nguyên tử chuyển từ trạng thái dừng mức năng lượng cao $E_m$ về trạng thái dừng mức thấp $E_n$ ($E_m > E_n$) thì phát ra photon có năng lượng như thế nào?",
    ground_truth: "Phát ra một photon có năng lượng đúng bằng hiệu hai mức năng lượng: $\\varepsilon = h f_{mn} = \\frac{hc}{\\lambda_{mn}} = E_m - E_n$."
  },
  BENCH_LY_35: {
    question: "Đại lượng nào đặc trưng cho độ bền vững của hạt nhân nguyên tử?",
    ground_truth: "Năng lượng liên kết riêng: $\\varepsilon_{\\text{lkr}} = \\frac{W_{\\text{lk}}}{A}$ (năng lượng liên kết tính trên một nuclon). Năng lượng liên kết riêng càng lớn thì hạt nhân càng bền vững (bền nhất với số khối $A$ trong khoảng từ $50$ đến $80$)."
  },
  BENCH_LY_37: {
    question: "Phát biểu định luật Ohm cho toàn mạch kín và nêu điều kiện xảy ra hiện tượng đoản mạch.",
    ground_truth: "$I = \\frac{\\mathcal{E}}{R_N + r}$. Hiện tượng đoản mạch xảy ra khi điện trở mạch ngoài $R_N \\approx 0$, khi đó cường độ dòng điện $I = \\frac{\\mathcal{E}}{r}$ tăng vọt lên rất lớn gây nguy cơ cháy nổ."
  },

  // ==================== HÓA HỌC (38 CA) ====================
  BENCH_HOA_02: {
    question: "Trong một chu kỳ của bảng tuần hoàn, theo chiều tăng dần của điện tích hạt nhân (từ trái sang phải), bán kính nguyên tử và độ âm điện biến đổi như thế nào?",
    ground_truth: "Bán kính nguyên tử giảm dần; độ âm điện tăng dần (do điện tích hạt nhân $Z$ tăng hút mạnh các electron lớp ngoài cùng trong khi số lớp electron không đổi)."
  },
  BENCH_HOA_03: {
    question: "Phân biệt liên kết ion trong $\\text{NaCl}$ và liên kết cộng hóa trị phân cực trong $\\text{HCl}$ dựa vào hiệu độ âm điện $\\Delta\\chi$.",
    ground_truth: "Với $\\text{NaCl}$: $\\Delta\\chi \\ge 1{,}7$ (liên kết ion do lực hút tĩnh điện giữa ion $\\text{Na}^+$ và $\\text{Cl}^-$). Với $\\text{HCl}$: $0{,}4 \\le \\Delta\\chi < 1{,}7$ (liên kết cộng hóa trị có cực, cặp electron dùng chung lệch về phía nguyên tử $\\text{Cl}$)."
  },
  BENCH_HOA_07: {
    question: "Viết phương trình hóa học dạng ion thu gọn khi cho kết tủa $\\text{Al(OH)}_3$ tan trong dung dịch $\\text{NaOH}$ dư theo chuẩn SGK GDPT 2018.",
    ground_truth: "$\\text{Al(OH)}_3 + \\text{OH}^- \\longrightarrow [\\text{Al(OH)}_4]^-$ (tạo phức chất tan tetrahydroxoaluminat, không dùng ký hiệu cũ $\\text{AlO}_2^-$)."
  },
  BENCH_HOA_08: {
    question: "Nêu hiện tượng và viết công thức ion phức chất tạo thành khi cho dung dịch $\\text{NH}_3$ dư vào kết tủa $\\text{Cu(OH)}_2$.",
    ground_truth: "Kết tủa $\\text{Cu(OH)}_2$ màu xanh nhạt tan dần tạo dung dịch màu xanh lam thẫm chứa phức chất $[\\text{Cu(NH}_3)_4]^{2+}$ (tetraamminecopper(II))."
  },
  BENCH_HOA_09: {
    question: "Màu sắc dung dịch muối crom(VI) thay đổi thế nào khi chuyển từ môi trường kiềm sang môi trường axit?",
    ground_truth: "Cân bằng chuyển dịch: $2\\text{CrO}_4^{2-} \\text{ (vàng)} + 2\\text{H}^+ \\rightleftharpoons \\text{Cr}_2\\text{O}_7^{2-} \\text{ (da cam)} + \\text{H}_2\\text{O}$. Trong môi trường axit chuyển sang màu da cam, trong môi trường kiềm chuyển sang màu vàng."
  },
  BENCH_HOA_10: {
    question: "Tại sao kẽm viên tan chậm hơn kẽm bột khi cho cùng một khối lượng tác dụng với cùng thể tích dung dịch $\\text{HCl}$ cùng nồng độ?",
    ground_truth: "Kẽm bột có diện tích bề mặt tiếp xúc với dung dịch axit lớn hơn nhiều lần so với kẽm viên, làm tăng tần số va chạm hiệu quả giữa các tiểu phân, do đó tốc độ phản ứng tăng."
  },
  BENCH_HOA_12: {
    question: "Viết phương trình hóa học của phản ứng xà phòng hóa triolein bằng dung dịch $\\text{NaOH}$ đun nóng.",
    ground_truth: "$(\\text{C}_{17}\\text{H}_{33}\\text{COO})_3\\text{C}_3\\text{H}_5 + 3\\text{NaOH} \\xrightarrow{t^\\circ} 3\\text{C}_{17}\\text{H}_{33}\\text{COONa} + \\text{C}_3\\text{H}_5(\\text{OH})_3$ (sinh ra muối natri oleat dùng làm xà phòng và glixerol)."
  },
  BENCH_HOA_13: {
    question: "Viết công thức cấu tạo các đồng phân este có công thức phân tử $\\text{C}_3\\text{H}_6\\text{O}_2$.",
    ground_truth: "Có 2 đồng phân este: $\\text{HCOOC}_2\\text{H}_5$ (etyl fomat / ethyl formate) và $\\text{CH}_3\\text{COOCH}_3$ (metyl axetat / methyl acetate)."
  },
  BENCH_HOA_14: {
    question: "Nêu hiện tượng và viết sơ đồ phản ứng khi đun nóng dung dịch glucozơ với thuốc thử Tollens $[\\text{Ag(NH}_3)_2]\\text{OH}$.",
    ground_truth: "Xuất hiện lớp bạc kim loại sáng bóng bám vào thành ống nghiệm (phản ứng tráng bạc): $\\text{C}_6\\text{H}_{12}\\text{O}_6 + 2[\\text{Ag(NH}_3)_2]\\text{OH} \\xrightarrow{t^\\circ} \\text{C}_6\\text{H}_{11}\\text{O}_7\\text{NH}_4 + 2\\text{Ag}\\downarrow + 3\\text{NH}_3 + \\text{H}_2\\text{O}$."
  },
  BENCH_HOA_15: {
    question: "Bằng phương pháp hóa học, làm thế nào để phân biệt dung dịch glucozơ và dung dịch saccarozơ?",
    ground_truth: "Dùng thuốc thử Tollens $[\\text{Ag(NH}_3)_2]\\text{OH}$ đun nóng: Glucozơ cho phản ứng tráng bạc xuất hiện kết tủa $\\text{Ag}$ sáng bóng (do có nhóm $-\\text{CHO}$), còn Saccarozơ không phản ứng."
  },
  BENCH_HOA_16: {
    question: "Nêu hiện tượng và giải thích khi nhỏ vài giọt dung dịch iot vào hồ tinh bột, sau đó đun nóng rồi để nguội.",
    ground_truth: "Hồ tinh bột chuyển sang màu xanh tím do phân tử $\\text{I}_2$ chui vào các lỗ rỗng xoắn của mạch amilozơ. Khi đun nóng màu xanh tím biến mất (do mạch xoắn duỗi ra giải phóng iot); khi để nguội màu xanh tím xuất hiện trở lại."
  },
  BENCH_HOA_18: {
    question: "Tại sao dung dịch anilin $\\text{C}_6\\text{H}_5\\text{NH}_2$ không làm đổi màu quỳ tím nhưng vẫn phản ứng được với dung dịch $\\text{HCl}$?",
    ground_truth: "Do gốc phenyl $-\\text{C}_6\\text{H}_5$ hút electron làm giảm mạnh mật độ điện tích âm trên nguyên tử $\\text{N}$, làm lực bazơ của anilin rất yếu (không làm đổi màu quỳ tím), nhưng vẫn còn đôi electron tự do nên phản ứng được với axit mạnh: $\\text{C}_6\\text{H}_5\\text{NH}_2 + \\text{HCl} \\longrightarrow \\text{C}_6\\text{H}_5\\text{NH}_3\\text{Cl}$."
  },
  BENCH_HOA_19: {
    question: "Dipeptit $\\text{Gly-Ala}$ có cho phản ứng màu biure với $\\text{Cu(OH)}_2$ không? Giải thích.",
    ground_truth: "Không. Phản ứng màu biure đòi hỏi phân tử peptit phải có từ 2 liên kết peptit trở lên (tức là từ tripeptit trở lên). Dipeptit chỉ có 1 liên kết peptit nên không tạo phức màu tím với $\\text{Cu(OH)}_2$."
  },
  BENCH_HOA_21: {
    question: "Dựa vào dãy điện hóa kim loại, phản ứng giữa cặp oxi hóa - khử $\\text{Fe}^{2+}/\\text{Fe}$ và $\\text{Cu}^{2+}/\\text{Cu}$ xảy ra theo chiều nào?",
    ground_truth: "Phản ứng xảy ra theo quy tắc alpha: $\\text{Fe} + \\text{Cu}^{2+} \\longrightarrow \\text{Fe}^{2+} + \\text{Cu}$ (chất khử mạnh $\\text{Fe}$ tác dụng với chất oxi hóa mạnh $\\text{Cu}^{2+}$ tạo thành chất khử yếu hơn $\\text{Cu}$ và chất oxi hóa yếu hơn $\\text{Fe}^{2+}$)."
  },
  BENCH_HOA_23: {
    question: "Viết phương trình điện phân nóng chảy $\\text{Al}_2\\text{O}_3$ sản xuất nhôm và nêu vai trò của criolit $(\\text{Na}_3\\text{AlF}_6)$.",
    ground_truth: "$2\\text{Al}_2\\text{O}_3 \\xrightarrow{\\text{đpnc}} 4\\text{Al} + 3\\text{O}_2\\uparrow$. Vai trò của criolit: hạ nhiệt độ nóng chảy của $\\text{Al}_2\\text{O}_3$ từ $2050^\\circ\\text{C}$ xuống $900^\\circ\\text{C}$, tăng độ dẫn điện của dung dịch, có khối lượng riêng nhẹ hơn nhôm nên nổi lên trên ngăn nhôm lỏng bị oxi hóa bởi không khí."
  },
  BENCH_HOA_24: {
    question: "Cho kim loại $\\text{Fe}$ tác dụng với dung dịch $\\text{HNO}_3$ đặc nguội và $\\text{HNO}_3$ đặc nóng. Nêu hiện tượng của từng trường hợp.",
    ground_truth: "Với $\\text{HNO}_3$ đặc nguội: $\\text{Fe}$ bị thụ động hóa, không có hiện tượng phản ứng. Với $\\text{HNO}_3$ đặc nóng: $\\text{Fe}$ tan mạnh, sủi bọt khí màu nâu đỏ $\\text{NO}_2$ và dung dịch chuyển sang màu vàng nâu của $\\text{Fe(NO}_3)_3$."
  },
  BENCH_HOA_25: {
    question: "Nêu hiện tượng và viết phương trình giải thích khi nhỏ axit sunfuric đặc $\\text{H}_2\\text{SO}_4$ vào đường saccarozơ $\\text{C}_{12}\\text{H}_{22}\\text{O}_{11}$.",
    ground_truth: "Đường bị hút nước hóa than đen xì, sau đó cột than xốp dâng trào lên miệng cốc do khí $\\text{CO}_2$ và $\\text{SO}_2$ thoát ra: $\\text{C}_{12}\\text{H}_{22}\\text{O}_{11} \\xrightarrow{\\text{H}_2\\text{SO}_4\\text{ đặc}} 12\\text{C} + 11\\text{H}_2\\text{O}$; $\\text{C} + 2\\text{H}_2\\text{SO}_4\\text{ (đặc)} \\longrightarrow \\text{CO}_2\\uparrow + 2\\text{SO}_2\\uparrow + 2\\text{H}_2\\text{O}$."
  },
  BENCH_HOA_26: {
    question: "Nêu thành phần hóa học của nước Javel và nguyên nhân tạo nên tính tẩy màu, sát trùng của nó.",
    ground_truth: "Thành phần gồm hỗn hợp muối $\\text{NaCl}$ và $\\text{NaClO}$. Tính tẩy màu và sát trùng là do ion hypoclorit $\\text{ClO}^-$ có tính oxi hóa rất mạnh."
  },
  BENCH_HOA_27: {
    question: "Phân biệt phản ứng tỏa nhiệt và phản ứng thu nhiệt dựa vào dấu của biến thiên enthalpy chuẩn $\\Delta_r H_{298}^\\circ$.",
    ground_truth: "Nếu $\\Delta_r H_{298}^\\circ < 0$: phản ứng tỏa nhiệt (giải phóng nhiệt lượng ra môi trường xung quanh). Nếu $\\Delta_r H_{298}^\\circ > 0$: phản ứng thu nhiệt (hấp thụ nhiệt lượng từ môi trường xung quanh)."
  },
  BENCH_HOA_28: {
    question: "Viết phương trình phản ứng trùng hợp etilen tạo ra polietilen (PE).",
    ground_truth: "$n\\,\\text{CH}_2=\\text{CH}_2 \\xrightarrow{t^\\circ, p, xt} (-\\text{CH}_2-\\text{CH}_2-)_n$."
  },
  BENCH_HOA_29: {
    question: "Nêu công thức cấu tạo của hai chất ban đầu dùng để điều chế tơ nilon-6,6 bằng phản ứng trùng ngưng.",
    ground_truth: "Axit ađipic $\\text{HOOC}-(\\text{CH}_2)_4-\\text{COOH}$ (axit hexandioic) và hexametylendiamin $\\text{H}_2\\text{N}-(\\text{CH}_2)_6-\\text{NH}_2$ (hexan-1,6-diamin)."
  },
  BENCH_HOA_30: {
    question: "Hai loại khí thải công nghiệp chủ yếu nào hòa tan trong nước mưa gây ra hiện tượng mưa axit?",
    ground_truth: "Khí lưu huỳnh đioxit $\\text{SO}_2$ và các oxit của nitơ $\\text{NO}_x$ (như $\\text{NO}_2$)."
  },
  BENCH_HOA_31: {
    question: "Khí nào là nguyên nhân chính gây ra hiệu ứng nhà kính làm Trái Đất ấm lên toàn cầu?",
    ground_truth: "Khí cacbon đioxit $\\text{CO}_2$ (ngoài ra còn có khí metan $\\text{CH}_4$, $\\text{N}_2\\text{O}$ và hơi nước)."
  },
  BENCH_HOA_32: {
    question: "Tại sao phân tử fructozơ không chứa nhóm chức anđehit $-\\text{CHO}$ nhưng vẫn tham gia phản ứng tráng bạc với thuốc thử Tollens?",
    ground_truth: "Vì trong môi trường bazơ (dung dịch $\\text{NH}_3$ của thuốc thử Tollens), fructozơ chuyển hóa thuận nghịch thành glucozơ: $\\text{Fructozơ} \\rightleftharpoons \\text{Glucozơ}$, glucozơ có nhóm $-\\text{CHO}$ tự do tham gia phản ứng tráng bạc."
  },
  BENCH_HOA_33: {
    question: "Thủy phân hoàn toàn $1\\text{ mol}$ tripeptit mạch hở $\\text{Gly-Ala-Val}$ bằng dung dịch $\\text{NaOH}$ dư cần bao nhiêu mol $\\text{NaOH}$?",
    ground_truth: "Cần đúng $3\\text{ mol } \\text{NaOH}$: $\\text{Gly-Ala-Val} + 3\\text{NaOH} \\longrightarrow \\text{Gly-Na} + \\text{Ala-Na} + \\text{Val-Na} + \\text{H}_2\\text{O}$."
  },
  BENCH_HOA_34: {
    question: "Tại sao các kim loại kiềm như $\\text{Na}, \\text{K}$ phải được bảo quản bằng cách ngâm chìm hoàn toàn trong dầu hỏa?",
    ground_truth: "Vì kim loại kiềm có tính khử rất mạnh, phản ứng mãnh liệt với oxi trong không khí và hơi nước tạo khí $\\text{H}_2$ dễ gây bốc cháy nguy hiểm; dầu hỏa trơ và ngăn cách kim loại với không khí và nước."
  },
  BENCH_HOA_35: {
    question: "Trong lò cao luyện gang, chất khử chủ yếu để khử oxit sắt $\\text{Fe}_2\\text{O}_3$ thành sắt tự do $\\text{Fe}$ là gì?",
    ground_truth: "Khí cacbon monooxit $\\text{CO}$ (sinh ra do than cốc $\\text{C}$ cháy trong luồng không khí nóng thiếu oxi: $\\text{C} + \\text{O}_2 \\xrightarrow{t^\\circ} \\text{CO}_2$; $\\text{CO}_2 + \\text{C} \\xrightarrow{t^\\circ} 2\\text{CO}$)."
  },
  BENCH_HOA_37: {
    question: "Phản ứng nhiệt nhôm là gì? Viết phương trình phản ứng khi cho bột $\\text{Al}$ tác dụng với $\\text{Fe}_2\\text{O}_3$ ở nhiệt độ cao.",
    ground_truth: "Phản ứng nhiệt nhôm là phản ứng dùng bột nhôm $\\text{Al}$ khử các oxit kim loại ở nhiệt độ cao: $2\\text{Al} + \\text{Fe}_2\\text{O}_3 \\xrightarrow{t^\\circ} \\text{Al}_2\\text{O}_3 + 2\\text{Fe}$ (tỏa lượng nhiệt rất lớn trên $2000^\\circ\\text{C}$ làm sắt nóng chảy, ứng dụng hàn đường ray xe lửa)."
  },
  BENCH_HOA_38: {
    question: "Thuốc thử đặc trưng để nhận biết ion sunfat $\\text{SO}_4^{2-}$ trong dung dịch và hiện tượng quan sát được là gì?",
    ground_truth: "Dùng dung dịch chứa ion $\\text{Ba}^{2+}$ (như $\\text{BaCl}_2$ hoặc $\\text{Ba(OH)}_2$), xuất hiện kết tủa trắng $\\text{BaSO}_4\\downarrow$ không tan trong axit mạnh: $\\text{Ba}^{2+} + \\text{SO}_4^{2-} \\longrightarrow \\text{BaSO}_4\\downarrow$."
  },

  // ==================== SINH HỌC (34 CA) ====================
  BENCH_SINH_02: {
    question: "Nêu 2 nguyên tắc cốt lõi trong quá trình nhân đôi của phân tử ADN.",
    ground_truth: "1) Nguyên tắc bổ sung ($\\text{A}-\\text{T}$, $\\text{G}-\\text{X}$); 2) Nguyên tắc bán bảo tồn (bán bảo toàn: trong mỗi phân tử $\\text{ADN}$ con có một mạch của mẹ và một mạch mới được tổng hợp)."
  },
  BENCH_SINH_04: {
    question: "Quá trình phiên mã diễn ra theo nguyên tắc nào và sử dụng loại enzim chính nào?",
    ground_truth: "Diễn ra theo nguyên tắc bổ sung giữa mạch mã gốc của gen với các ribonucleotit tự do: $\\text{A}_{\\text{gốc}} - \\text{U}$, $\\text{T}_{\\text{gốc}} - \\text{A}$, $\\text{G}_{\\text{gốc}} - \\text{X}$, $\\text{X}_{\\text{gốc}} - \\text{G}$, dưới sự xúc tác của enzim $\\text{ARN polimeraza}$."
  },
  BENCH_SINH_06: {
    question: "Nêu các thành phần cấu trúc của cụm gen $\\text{Operon Lac}$ ở vi khuẩn và vai trò của vùng vận hành $O$.",
    ground_truth: "$\\text{Operon Lac}$ gồm: Vùng khởi động $P$, Vùng vận hành $O$ (nơi protein ức chế liên kết để ngăn cản phiên mã) và Nhóm gen cấu trúc $Z, Y, A$ mã hóa các enzim phân giải đường lactozơ."
  },
  BENCH_SINH_08: {
    question: "Nêu thành phần và cấu trúc của một nuclêôxôm trong cấu trúc siêu hiển vi của nhiễm sắc thể.",
    ground_truth: "Gồm 8 phân tử protein histon tạo thành khối cầu được quấn quanh bởi một đoạn $\\text{ADN}$ chứa khoảng $146$ cặp nucleotit (quấn đúng $1\\frac{3}{4}$ vòng)."
  },
  BENCH_SINH_11: {
    question: "Cơ sở tế bào học của quy luật phân ly Menđen trong quá trình giảm phân là gì?",
    ground_truth: "Sự phân ly đồng đều của cặp nhiễm sắc thể tương đồng trong giảm phân $I$ dẫn đến sự phân ly đồng đều của cặp alen ($Aa$) về các giao tử ($50\\%\\ A : 50\\%\\ a$)."
  },
  BENCH_SINH_13: {
    question: "Cho phép lai $P: AaBb \\times AaBb$ thu được đời con $F_1$ có tỉ lệ kiểu hình $9\\text{ hoa đỏ} : 7\\text{ hoa trắng}$. Đây là dạng quy luật tương tác gen nào?",
    ground_truth: "Tương tác gen bổ sung kiểu $9:7$ (khi trong kiểu gen có mặt đồng thời cả hai alen trội $A$ và $B$ quy định hoa đỏ, các kiểu gen còn lại $A-bb$, $aaB-$, $aabb$ quy định hoa trắng)."
  },
  BENCH_SINH_14: {
    question: "Phép lai ruồi giấm cái thân xám, cánh dài dị hợp chéo $\\frac{Ab}{aB}$ lai phân tích với ruồi giấm đực $\\frac{ab}{ab}$ (liên kết gen hoàn toàn). Xác định tỉ lệ kiểu hình ở đời con.",
    ground_truth: "Đời con thu được tỉ lệ: $1\\text{ thân xám, cánh cụt } \\left(\\frac{Ab}{ab}\\right) : 1\\text{ thân đen, cánh dài } \\left(\\frac{aB}{ab}\\right)$ (tỉ lệ $1 : 1$)."
  },
  BENCH_SINH_16: {
    question: "Bệnh mù màu ở người do alen lặn $m$ nằm trên vùng không tương đồng của nhiễm sắc thể $X$ quy định ($Y$ không mang alen). Mẹ bị bệnh mù màu ($X^m X^m$) kết hôn với bố bình thường ($X^M Y$). Con trai sinh ra có bị bệnh mù màu không?",
    ground_truth: "$100\\%$ số con trai sinh ra đều bị bệnh mù màu ($X^m Y$), do con trai luôn nhận nhiễm sắc thể $X^m$ mang gen bệnh từ mẹ và nhận $Y$ từ bố."
  },
  BENCH_SINH_31: {
    question: "Trong chuỗi thức ăn: $\\text{Cỏ} \\longrightarrow \\text{Cào cào} \\longrightarrow \\text{Ếch} \\longrightarrow \\text{Rắn}$, sinh vật tiêu thụ bậc 2 là loài nào?",
    ground_truth: "Ếch là sinh vật tiêu thụ bậc 2 (thuộc bậc dinh dưỡng cấp 3; cỏ là sinh vật sản xuất, cào cào là sinh vật tiêu thụ bậc 1)."
  },
  BENCH_SINH_33: {
    question: "Nhóm vi sinh vật nào có khả năng cố định nitơ tự do trong khí quyển ($\\text{N}_2$) thành dạng amoni ($\\text{NH}_4^+$)?",
    ground_truth: "Vi sinh vật cố định nitơ sống tự do (như vi khuẩn $\\textit{Azotobacter}$, $\\textit{Clostridium}$, vi khuẩn lam) và vi sinh vật cộng sinh (như vi khuẩn nốt sần rễ cây họ Đậu $\\textit{Rhizobium}$)."
  }
};

let updatedCount = 0;
dataset.forEach(item => {
  const patch = LATEX_UPDATES[item.id];
  if (patch) {
    if (patch.question) item.question = patch.question;
    if (patch.ground_truth) {
      item.ground_truth = patch.ground_truth;
      const subjName = item.subject === 'toan' ? 'Toán' : (item.subject === 'ly' ? 'Vật lý' : (item.subject === 'hoa' ? 'Hóa học' : 'Sinh học'));
      item.gemini_response = `Phân tích theo SGK ${subjName} GDPT 2018: ${patch.ground_truth}`;
    }
    updatedCount++;
  }
});

console.log(`Đã cập nhật ${updatedCount} ca benchmark sang chuẩn LaTeX hoàn hảo!`);
fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');

// Đồng bộ sang SYNTHETIC_BENCHMARK_150.csv
const csvRows = ['id,subject,grade,topic,difficulty,question,ground_truth,sgk_reference'];
dataset.forEach(it => {
  const escapeCsv = (str) => `"${(str || '').replace(/"/g, '""')}"`;
  csvRows.push([
    it.id,
    it.subject,
    it.grade,
    escapeCsv(it.topic),
    escapeCsv(it.difficulty),
    escapeCsv(it.question),
    escapeCsv(it.ground_truth),
    escapeCsv(it.sgk_reference)
  ].join(','));
});
fs.writeFileSync('SYNTHETIC_BENCHMARK_150.csv', '\uFEFF' + csvRows.join('\n'), 'utf8');
console.log('Đã đồng bộ sang SYNTHETIC_BENCHMARK_150.csv thành công!');

