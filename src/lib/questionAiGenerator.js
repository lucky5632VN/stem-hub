/**
 * BỘ SINH CÂU HỎI TỰ ĐỘNG THPT (AI PROCEDURAL QUESTION GENERATOR)
 * Hỗ trợ 4 môn STEM (Toán học, Vật lý, Hóa học, Sinh học)
 * 3 định dạng chuẩn GDPT 2018: Trắc nghiệm (MCQ), Đúng/Sai (TF), Trả lời ngắn (SA)
 * 100% Tiếng Việt, hỗ trợ công thức LaTeX $...$
 */

// Hàm xáo trộn mảng
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Hàm định dạng số thực gọn
const fmt = (num) => {
  if (Number.isInteger(num)) return num.toString();
  return Number(num.toFixed(2)).toString();
};

// ============================================================================
// 1. NGÂN HÀNG CÂU HỎI TOÁN HỌC (>550 câu)
// ============================================================================
export const generateMathQuestions = (count = 550) => {
  const list = [];
  const difficulties = ['easy', 'medium', 'hard'];

  // --- 1.1 Trắc nghiệm MCQ (~350 câu) ---
  for (let i = 0; i < 350; i++) {
    const seed = i + 1;
    const diff = difficulties[i % 3];
    let q = {};

    const category = i % 7;
    if (category === 0) {
      // Đạo hàm & Cực trị
      const a = (seed % 5) + 1;
      const b = (seed * 3) % 9 + 1;
      const c = (seed * 2) % 7 - 3;
      // y = a*x^3 - 3*a*b^2*x + c  => y' = 3a(x^2 - b^2) => cực trị x = ±b
      const xCD = -b;
      const xCT = b;
      const yCD = a * Math.pow(xCD, 3) - 3 * a * b * b * xCD + c;
      const yCT = a * Math.pow(xCT, 3) - 3 * a * b * b * xCT + c;

      const correctAns = `Cực đại $x = ${xCD}$, giá trị cực đại $y_{CĐ} = ${yCD}$`;
      const choices = shuffle([
        correctAns,
        `Cực đại $x = ${xCT}$, giá trị cực đại $y_{CĐ} = ${yCT}$`,
        `Cực tiểu $x = ${xCD}$, giá trị cực tiểu $y_{CT} = ${yCD}$`,
        `Hàm số không có cực trị`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Cho hàm số $y = ${a === 1 ? '' : a}x^3 - ${3 * a * b * b}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}$. Phát biểu nào sau đây đúng về cực trị của hàm số?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Đạo hàm $y' = ${3 * a}x^2 - ${3 * a * b * b} = 0 \\Leftrightarrow x = \\pm ${b}$. Bảng biến thiên cho thấy $x = ${xCD}$ là điểm cực đại với $y_{CĐ} = ${yCD}$.`
      };
    } else if (category === 1) {
      // Tiệm cận đồ thị hàm số
      const a = (seed % 7) + 1;
      const b = (seed * 2) % 11 + 1;
      const c = (seed * 3) % 5 + 1;
      const d = (seed % 4) + 1;
      // y = (a x + b) / (c x - d) => TCN: y = a/c, TCĐ: x = d/c

      const tcn = fmt(a / c);
      const tcd = fmt(d / c);
      const correctAns = `Tiệm cận ngang $y = ${tcn}$, tiệm cận đứng $x = ${tcd}$`;
      const choices = shuffle([
        correctAns,
        `Tiệm cận ngang $x = ${tcn}$, tiệm cận đứng $y = ${tcd}$`,
        `Tiệm cận ngang $y = ${tcd}$, tiệm cận đứng $x = ${tcn}$`,
        `Đồ thị không có tiệm cận`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Đường tiệm cận ngang và tiệm cận đứng của đồ thị hàm số $y = \\frac{${a}x + ${b}}{${c === 1 ? '' : c}x - ${d}}$ lần lượt là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$\\lim_{x \\to \\pm \\infty} y = \\frac{${a}}{${c}} = ${tcn} \\Rightarrow$ TCN $y = ${tcn}$. Mẫu số $x = \\frac{${d}}{${c}} = ${tcd} \\Rightarrow$ TCĐ $x = ${tcd}$.`
      };
    } else if (category === 2) {
      // Phương trình mũ & Logarit
      const base = (seed % 3) + 2;
      const val = Math.pow(base, (seed % 4) + 2);
      const expAns = Math.log(val) / Math.log(base);
      const k = (seed % 5) + 1;

      const correctAns = `$x = ${expAns + k}$`;
      const choices = shuffle([
        correctAns,
        `$x = ${expAns}$`,
        `$x = ${expAns - k}$`,
        `$x = ${expAns * 2}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Nghiệm của phương trình $\\log_{${base}}(x - ${k}) = ${expAns}$ là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Điều kiện $x > ${k}$. Ta có $x - ${k} = ${base}^{${expAns}} = ${val} \\Rightarrow x = ${val} + ${k} = ${expAns + k}$.`
      };
    } else if (category === 3) {
      // Nguyên hàm & Tích phân
      const n = (seed % 4) + 2;
      const a = (seed % 6) + 1;

      const correctAns = `$\\frac{${a}}{${n + 1}} x^{${n + 1}} + C$`;
      const choices = shuffle([
        correctAns,
        `$${a * n} x^{${n - 1}} + C$`,
        `$\\frac{${a}}{${n}} x^{${n + 1}} + C$`,
        `$${a} x^{${n + 1}} + C$`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Họ tất cả các nguyên hàm của hàm số $f(x) = ${a}x^{${n}}$ là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$\\int ${a}x^{${n}} dx = ${a} \\cdot \\frac{x^{${n + 1}}}{${n + 1}} + C = \\frac{${a}}{${n + 1}} x^{${n + 1}} + C$.`
      };
    } else if (category === 4) {
      // Số phức
      const r1 = (seed % 7) - 3;
      const i1 = (seed * 2) % 7 + 1;
      const r2 = (seed * 3) % 7 + 2;
      const i2 = (seed * 4) % 7 - 4;

      const rSum = r1 + r2;
      const iSum = i1 + i2;
      const correctAns = `$z = ${rSum} ${iSum >= 0 ? '+ ' + iSum : '- ' + Math.abs(iSum)}i$`;
      const choices = shuffle([
        correctAns,
        `$z = ${r1 - r2} ${i1 - i2 >= 0 ? '+ ' + (i1 - i2) : '- ' + Math.abs(i1 - i2)}i$`,
        `$z = ${rSum * 2} + ${iSum * 2}i$`,
        `$z = ${rSum} - ${iSum}i$`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Cho hai số phức $z_1 = ${r1} ${i1 >= 0 ? '+ ' + i1 : '- ' + Math.abs(i1)}i$ và $z_2 = ${r2} ${i2 >= 0 ? '+ ' + i2 : '- ' + Math.abs(i2)}i$. Tính tổng $z = z_1 + z_2$.`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$z = (${r1} + ${r2}) + (${i1} ${i2 >= 0 ? '+' + i2 : i2})i = ${rSum} ${iSum >= 0 ? '+ ' + iSum : '- ' + Math.abs(iSum)}i$.`
      };
    } else if (category === 5) {
      // Hình học Oxyz
      const x = (seed % 9) - 4;
      const y = (seed * 2) % 9 - 4;
      const z = (seed * 3) % 9 - 4;

      const correctAns = `$\\vec{n} = (${x}; ${y}; ${z})$`;
      const choices = shuffle([
        correctAns,
        `$\\vec{n} = (${y}; ${x}; ${z})$`,
        `$\\vec{n} = (${-x}; ${y}; ${-z})$`,
        `$\\vec{n} = (1; 1; 1)$`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Trong không gian $Oxyz$, mặt phẳng $(P): ${x}x ${y >= 0 ? '+ ' + y : '- ' + Math.abs(y)}y ${z >= 0 ? '+ ' + z : '- ' + Math.abs(z)}z + 10 = 0$ có một vectơ pháp tuyến là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Vectơ pháp tuyến của mặt phẳng $Ax + By + Cz + D = 0$ là $\\vec{n} = (A; B; C) = (${x}; ${y}; ${z})$.`
      };
    } else {
      // Thể tích khối chóp & lăng trụ
      const a = (seed % 6) + 2;
      const h = (seed * 2) % 8 + 3;
      const v = fmt((1 / 3) * a * a * h);

      const correctAns = `$V = ${v} \\, \\text{đvtt}$`;
      const choices = shuffle([
        correctAns,
        `$V = ${fmt(a * a * h)} \\, \\text{đvtt}$`,
        `$V = ${fmt((1 / 2) * a * a * h)} \\, \\text{đvtt}$`,
        `$V = ${fmt((2 / 3) * a * a * h)} \\, \\text{đvtt}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'math',
        difficulty: diff,
        text: `Cho khối chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a = ${a}$, chiều cao $h = ${h}$. Thể tích $V$ của khối chóp $S.ABCD$ bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Diện tích đáy $S = a^2 = ${a}^2 = ${a * a}$. Thể tích $V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\cdot ${a * a} \\cdot ${h} = ${v}$.`
      };
    }

    list.push({ ...q, id: `math_mcq_${seed}` });
  }

  // --- 1.2 Đúng / Sai TF (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const a = (seed % 5) + 2;
    const b = (seed * 2) % 6 + 1;

    const st1 = `Hàm số $y = x^3 - ${3 * a}x$ đồng biến trên khoảng $(-\\infty; -\\sqrt{${a}})$ và $(\\sqrt{${a}}; +\\infty)$.`;
    const st2 = `Đồ thị hàm số $y = \\frac{2x + 1}{x - 1}$ có tiệm cận đứng $x = 1$.`;
    const st3 = `Giá trị của $\\log_2(${a * 4}) - \\log_2(${a})$ bằng 2.`;
    const st4 = `Trong không gian $Oxyz$, độ dài vectơ $\\vec{u} = (3; 4; 0)$ bằng 7.`;

    const c1 = true;
    const c2 = true;
    const c3 = true;
    const c4 = false; // sqrt(3^2 + 4^2) = 5 != 7

    list.push({
      id: `math_tf_${seed}`,
      type: 'tf',
      subject: 'math',
      difficulty: 'medium',
      text: `Cho các khẳng định toán học sau. Xét tính Đúng/Sai của từng phát biểu:`,
      statements: [st1, st2, st3, st4],
      correct: [c1, c2, c3, c4],
      choices: [
        `a) ${st1} -> ${c1 ? 'Đúng' : 'Sai'}`,
        `b) ${st2} -> ${c2 ? 'Đúng' : 'Sai'}`,
        `c) ${st3} -> ${c3 ? 'Đúng' : 'Sai'}`,
        `d) ${st4} -> ${c4 ? 'Đúng' : 'Sai'}`
      ],
      explanation: `a) $y' = 3x^2 - 3${a} > 0 \\Leftrightarrow x < -\\sqrt{${a}}$ hoặc $x > \\sqrt{${a}}$ (ĐÚNG). b) TCĐ $x = 1$ (ĐÚNG). c) $\\log_2(4a/a) = \\log_2 4 = 2$ (ĐÚNG). d) $|\\vec{u}| = \\sqrt{3^2 + 4^2} = 5 \\neq 7$ (SAI).`
    });
  }

  // --- 1.3 Trả lời ngắn SA (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const a = (seed % 8) + 2;
    const b = (seed * 3) % 9 + 1;
    const ansVal = a * b;

    list.push({
      id: `math_sa_${seed}`,
      type: 'sa',
      subject: 'math',
      difficulty: 'medium',
      text: `Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = ${a}$ và công bội $q = ${b}$. Tìm giá trị của số hạng thứ hai $u_2$.`,
      correctAnswer: ansVal.toString(),
      choices: [ansVal.toString()],
      correct: 0,
      explanation: `Số hạng thứ hai $u_2 = u_1 \\cdot q = ${a} \\cdot ${b} = ${ansVal}$.`
    });
  }

  return list;
};

// ============================================================================
// 2. NGÂN HÀNG CÂU HỎI VẬT LÝ (>550 câu)
// ============================================================================
export const generatePhysicsQuestions = (count = 550) => {
  const list = [];
  const difficulties = ['easy', 'medium', 'hard'];

  // --- 2.1 Trắc nghiệm MCQ (~350 câu) ---
  for (let i = 0; i < 350; i++) {
    const seed = i + 1;
    const diff = difficulties[i % 3];
    let q = {};
    const category = i % 7;

    if (category === 0) {
      // Dao động điều hòa
      const A = (seed % 10) + 4;
      const omega = ((seed % 4) + 1) * Math.PI;
      const f = fmt(omega / (2 * Math.PI));
      const vMax = fmt(omega * A);

      const correctAns = `$v_{\\max} = ${vMax} \\, \\text{cm/s}$`;
      const choices = shuffle([
        correctAns,
        `$v_{\\max} = ${fmt(omega * A * 2)} \\, \\text{cm/s}$`,
        `$v_{\\max} = ${fmt(A / omega)} \\, \\text{cm/s}$`,
        `$v_{\\max} = ${A} \\, \\text{cm/s}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Một vật dao động điều hòa với phương trình $x = ${A}\\cos(${fmt(omega / Math.PI)}\\pi t) \\, \\text{(cm)}$. Vận tốc cực đại của vật có giá trị bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Vận tốc cực đại $v_{\\max} = \\omega A = ${fmt(omega / Math.PI)}\\pi \\cdot ${A} \\approx ${vMax} \\, \\text{cm/s}$.`
      };
    } else if (category === 1) {
      // Sóng cơ & Sóng âm
      const v = ((seed % 5) + 2) * 100; // m/s
      const f = ((seed % 4) + 1) * 50; // Hz
      const lambda = fmt(v / f);

      const correctAns = `$\\lambda = ${lambda} \\, \\text{m}$`;
      const choices = shuffle([
        correctAns,
        `$\\lambda = ${fmt(v * f)} \\, \\text{m}$`,
        `$\\lambda = ${fmt(f / v)} \\, \\text{m}$`,
        `$\\lambda = ${fmt(lambda / 2)} \\, \\text{m}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Một sóng cơ truyền trong môi trường với tốc độ $v = ${v} \\, \\text{m/s}$ và tần số $f = ${f} \\, \\text{Hz}$. Bước sóng $\\lambda$ của sóng bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Công thức bước sóng $\\lambda = \\frac{v}{f} = \\frac{${v}}{${f}} = ${lambda} \\, \\text{m}$.`
      };
    } else if (category === 2) {
      // Mạch RLC nối tiếp
      const R = ((seed % 5) + 3) * 10;
      const ZL = ((seed % 6) + 4) * 10;
      const ZC = ((seed % 4) + 1) * 10;
      const Z = fmt(Math.sqrt(R * R + (ZL - ZC) * (ZL - ZC)));

      const correctAns = `$Z = ${Z} \\, \\Omega$`;
      const choices = shuffle([
        correctAns,
        `$Z = ${R + ZL + ZC} \\, \\Omega$`,
        `$Z = ${fmt(R + Math.abs(ZL - ZC))} \\, \\Omega$`,
        `$Z = ${fmt(Math.sqrt(R * R + ZL * ZL))} \\, \\Omega$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Mạch điện xoay chiều $RLC$ nối tiếp có $R = ${R} \\, \\Omega$, cảm kháng $Z_L = ${ZL} \\, \\Omega$ và dung kháng $Z_C = ${ZC} \\, \\Omega$. Tổng trở $Z$ của đoạn mạch bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Tổng trở $Z = \\sqrt{R^2 + (Z_L - Z_C)^2} = \\sqrt{${R}^2 + (${ZL} - ${ZC})^2} = ${Z} \\, \\Omega$.`
      };
    } else if (category === 3) {
      // Giao thoa ánh sáng
      const a = (seed % 3) + 1; // mm
      const D = (seed % 2) + 1; // m
      const lambda = (seed % 4) * 0.1 + 0.4; // um
      const iVal = fmt((lambda * D) / a);

      const correctAns = `$i = ${iVal} \\, \\text{mm}$`;
      const choices = shuffle([
        correctAns,
        `$i = ${fmt(iVal * 2)} \\, \\text{mm}$`,
        `$i = ${fmt(iVal / 2)} \\, \\text{mm}$`,
        `$i = ${fmt(lambda * D * a)} \\, \\text{mm}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Trong thí nghiệm Y-âng về giao thoa ánh sáng, khoảng cách 2 khe $a = ${a} \\, \\text{mm}$, khoảng cách đến màn $D = ${D} \\, \\text{m}$, ánh sáng bước sóng $\\lambda = ${fmt(lambda)} \\, \\mu\\text{m}$. Khoảng vân $i$ bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Khoảng vân $i = \\frac{\\lambda D}{a} = \\frac{${fmt(lambda)} \\cdot ${D}}{${a}} = ${iVal} \\, \\text{mm}$.`
      };
    } else if (category === 4) {
      // Hạt nhân phóng xạ
      const T = (seed % 5) + 2; // ngày
      const t = T * ((seed % 3) + 2);
      const ratio = fmt(Math.pow(0.5, t / T) * 100);

      const correctAns = `${ratio}%`;
      const choices = shuffle([
        correctAns,
        `${fmt(100 - Number(ratio))}%`,
        `${fmt(Number(ratio) / 2)}%`,
        `50%`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Một chất phóng xạ có chu kỳ bán rã $T = ${T}$ ngày. Sau khoảng thời gian $t = ${t}$ ngày, phần trăm số hạt nhân còn lại chưa bị phóng xạ là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Tỉ lệ còn lại $N/N_0 = 2^{-t/T} = 2^{-${t/T}} = ${ratio}\\%$.`
      };
    } else if (category === 5) {
      // Quang điện ngoài
      const A_eV = fmt((seed % 4) * 0.5 + 2.0); // eV
      const correctAns = `Công thoát $A = ${A_eV} \\, \\text{eV}$`;
      const choices = shuffle([
        correctAns,
        `Công thoát $A = ${fmt(Number(A_eV) * 2)} \\, \\text{eV}$`,
        `Giới hạn quang điện $\\lambda_0 = 1.0 \\, \\mu\\text{m}$`,
        `Động năng cực đại bằng $0$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Giới hạn quang điện của một kim loại phụ thuộc vào bản chất của kim loại đó thông qua đại lượng đặc trưng nào?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Giới hạn quang điện $\\lambda_0 = \\frac{hc}{A}$ phụ thuộc trực tiếp vào Công thoát $A$ của electron khỏi kim loại.`
      };
    } else {
      // Động lực học & Chuyển động
      const m = (seed % 5) + 1; // kg
      const a = (seed % 4) + 2; // m/s2
      const F = m * a;

      const correctAns = `$F = ${F} \\, \\text{N}$`;
      const choices = shuffle([
        correctAns,
        `$F = ${F * 2} \\, \\text{N}$`,
        `$F = ${fmt(m / a)} \\, \\text{N}$`,
        `$F = ${m + a} \\, \\text{N}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'physics',
        difficulty: diff,
        text: `Một vật khối lượng $m = ${m} \\, \\text{kg}$ chuyển động với gia tốc $a = ${a} \\, \\text{m/s}^2$. Độ lớn lực tổng hợp tác dụng lên vật bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Theo định luật II Newton $F = m \\cdot a = ${m} \\cdot ${a} = ${F} \\, \\text{N}$.`
      };
    }

    list.push({ ...q, id: `physics_mcq_${seed}` });
  }

  // --- 2.2 Đúng / Sai TF (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const st1 = `Vận tốc trong dao động điều hòa luôn sớm pha $\\pi/2$ so với li độ.`;
    const st2 = `Sóng âm truyền nhanh nhất trong môi trường Chân không.`;
    const st3 = `Khi xảy ra cộng hưởng điện trong mạch RLC thì cảm kháng bằng dung kháng ($Z_L = Z_C$).`;
    const st4 = `Tia hồng ngoại có bước sóng lớn hơn bước sóng của ánh sáng đỏ.`;

    list.push({
      id: `physics_tf_${seed}`,
      type: 'tf',
      subject: 'physics',
      difficulty: 'medium',
      text: `Cho các mệnh đề Vật lý sau. Hãy xác định tính Đúng/Sai của mỗi mệnh đề:`,
      statements: [st1, st2, st3, st4],
      correct: [true, false, true, true],
      choices: [
        `a) ${st1} -> Đúng`,
        `b) ${st2} -> Sai`,
        `c) ${st3} -> Đúng`,
        `d) ${st4} -> Đúng`
      ],
      explanation: `a) Vận tốc sớm pha $\\pi/2$ so li độ (ĐÚNG). b) Sóng âm KHÔNG truyền được trong chân không (SAI). c) Cộng hưởng điện khi $Z_L = Z_C$ (ĐÚNG). d) Tia hồng ngoại có bước sóng lớn hơn ánh sáng đỏ (ĐÚNG).`
    });
  }

  // --- 2.3 Trả lời ngắn SA (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const f = ((seed % 5) + 1) * 10;
    const T = fmt(1 / f);

    list.push({
      id: `physics_sa_${seed}`,
      type: 'sa',
      subject: 'physics',
      difficulty: 'easy',
      text: `Một vật dao động điều hòa với tần số $f = ${f} \\, \\text{Hz}$. Tính chu kỳ dao động $T$ (tính bằng giây) của vật.`,
      correctAnswer: T,
      choices: [T],
      correct: 0,
      explanation: `Chu kỳ $T = \\frac{1}{f} = \\frac{1}{${f}} = ${T} \\, \\text{s}$.`
    });
  }

  return list;
};

// ============================================================================
// 3. NGÂN HÀNG CÂU HỎI HÓA HỌC (>550 câu)
// ============================================================================
export const generateChemistryQuestions = (count = 550) => {
  const list = [];
  const difficulties = ['easy', 'medium', 'hard'];

  // --- 3.1 Trắc nghiệm MCQ (~350 câu) ---
  for (let i = 0; i < 350; i++) {
    const seed = i + 1;
    const diff = difficulties[i % 3];
    let q = {};
    const category = i % 7;

    if (category === 0) {
      // Este & Lipit
      const correctAns = `$\\text{CH}_3\\text{COOC}_2\\text{H}_5$ (Ethyl acetate)`;
      const choices = shuffle([
        correctAns,
        `$\\text{HCOOCH}_3$ (Methyl formate)`,
        `$\\text{C}_2\\text{H}_5\\text{COOCH}_3$ (Methyl propionate)`,
        `$\\text{CH}_3\\text{COOH}$ (Acetic acid)`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Este nào sau đây khi đun nóng với dung dịch $\\text{NaOH}$ tạo thành muối Sodium acetate và Ethyl alcohol?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$\\text{CH}_3\\text{COOC}_2\\text{H}_5 + \\text{NaOH} \\rightarrow \\text{CH}_3\\text{COONa} + \\text{C}_2\\text{H}_5\\text{OH}$.`
      };
    } else if (category === 1) {
      // Cacbohiđrat
      const correctAns = `Glucose và Fructose`;
      const choices = shuffle([
        correctAns,
        `Glucose và Galactose`,
        `Tinh bột và Xenlulozơ`,
        `Maltose và Sucrose`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Khi thủy phân hoàn toàn Sucrose (saccarozơ) trong môi trường axit thu được hai monosaccharide nào?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Sucrose $\\text{C}_{12}\\text{H}_{22}\\text{O}_{11} + \\text{H}_2\\text{O} \\xrightarrow{H^+, t^o} \\text{C}_6\\text{H}_{12}\\text{O}_6 (Glucose) + \\text{C}_6\\text{H}_{12}\\text{O}_6 (Fructose)$.`
      };
    } else if (category === 2) {
      // Amin & Amino Axit
      const correctAns = `Aniline ($\\text{C}_6\\text{H}_5\\text{NH}_2$)`;
      const choices = shuffle([
        correctAns,
        `Methylamine ($\\text{CH}_3\\text{NH}_2$)`,
        `Ethylamine ($\\text{C}_2\\text{H}_5\\text{NH}_2$)`,
        `Ammonia ($\\text{NH}_3$)`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Chất nào sau đây là amin thơm, ở điều kiện thường là chất lỏng ít tan trong nước và làm mất màu dung dịch Brom tạo kết tủa trắng?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Aniline tác dụng với nước Brom tạo kết tủa trắng 2,4,6-tribromoaniline.`
      };
    } else if (category === 3) {
      // Kim loại kiềm & Kiềm thổ
      const mNa = (seed % 5) + 1; // gam
      const nNa = mNa / 23;
      const vH2 = fmt((nNa / 2) * 22.4);

      const correctAns = `$V = ${vH2} \\, \\text{lít}$`;
      const choices = shuffle([
        correctAns,
        `$V = ${fmt(vH2 * 2)} \\, \\text{lít}$`,
        `$V = ${fmt(vH2 / 2)} \\, \\text{lít}$`,
        `$V = ${fmt(mNa * 22.4)} \\, \\text{lít}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Cho $m = ${mNa} \\, \\text{g}$ kim loại Natri (Na) vào nước dư. Thể tích khí $\\text{H}_2$ thu được ở đkc (lít) là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow$. Số mol $\\text{H}_2 = n_{\\text{Na}}/2 = \\frac{${mNa}}{46} \\Rightarrow V = ${vH2} \\, \\text{lít}$.`
      };
    } else if (category === 4) {
      // Sắt và hợp chất
      const correctAns = `$\\text{FeCl}_3$ (Sắt(III) clorua)`;
      const choices = shuffle([
        correctAns,
        `$\\text{FeCl}_2$ (Sắt(II) clorua)`,
        `$\\text{FeCl}_2$ và $\\text{HCl}$`,
        `Không có phản ứng`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Cho bột Sắt (Fe) đốt cháy trong khí Clo ($\\text{Cl}_2$) dư, sản phẩm muối thu được chứa sắt ở dạng nào?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Sắt tác dụng với khí Clo dư là chất oxi hóa mạnh tạo muối Sắt(III) clorua $2\\text{Fe} + 3\\text{Cl}_2 \\rightarrow 2\\text{FeCl}_3$.`
      };
    } else if (category === 5) {
      // Polime
      const correctAns = `Poli(vinyl clorua) - PVC`;
      const choices = shuffle([
        correctAns,
        `Polietilen - PE`,
        `Poliantranylet`,
        `Cao su buna`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Polime nào sau đây được điều chế bằng phản ứng trùng hợp monome Vinyl clorua ($\\text{CH}_2=\\text{CH-Cl}$)?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Trùng hợp $\\text{CH}_2=\\text{CH-Cl} \\rightarrow -(\\text{CH}_2-\\text{CH(Cl)})-_{n}$ (Poli(vinyl clorua)).`
      };
    } else {
      // Dung dịch & pH
      const pH = (seed % 4) + 1;
      const conc = fmt(Math.pow(10, -pH));

      const correctAns = `$${conc} \\, \\text{M}$`;
      const choices = shuffle([
        correctAns,
        `$0.1 \\, \\text{M}$`,
        `$1.0 \\, \\text{M}$`,
        `$0.05 \\, \\text{M}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'chemistry',
        difficulty: diff,
        text: `Một dung dịch axit $\\text{HCl}$ có $\\text{pH} = ${pH}$. Nồng độ ion $[\\text{H}^+]$ trong dung dịch này bằng:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `$[\\text{H}^+] = 10^{-\\text{pH}} = 10^{-${pH}} = ${conc} \\, \\text{M}$.`
      };
    }

    list.push({ ...q, id: `chem_mcq_${seed}` });
  }

  // --- 3.2 Đúng / Sai TF (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const st1 = `Glucose và Fructose là hai chất đồng phân của nhau.`;
    const st2 = `Tất cả các peptit đều có phản ứng màu Biuret với $\\text{Cu(OH)}_2$.`;
    const st3 = `Kim loại Nhôm (Al) thụ động trong dung dịch $\\text{HNO}_3$ đặc, nguội.`;
    const st4 = `Nước cứng là nước chứa nhiều ion $\\text{Ca}^{2+}$ và $\\text{Mg}^{2+}$.`;

    list.push({
      id: `chem_tf_${seed}`,
      type: 'tf',
      subject: 'chemistry',
      difficulty: 'medium',
      text: `Cho các mệnh đề Hóa học sau. Hãy xác định tính Đúng/Sai của từng phát biểu:`,
      statements: [st1, st2, st3, st4],
      correct: [true, false, true, true],
      choices: [
        `a) ${st1} -> Đúng`,
        `b) ${st2} -> Sai`,
        `c) ${st3} -> Đúng`,
        `d) ${st4} -> Đúng`
      ],
      explanation: `a) Glucose và Fructose cùng C6H12O6 (ĐÚNG). b) Dipeptit KHÔNG có phản ứng màu Biuret (SAI). c) Al, Fe, Cr thụ động trong HNO3 đặc nguội (ĐÚNG). d) Nước cứng chứa Ca2+, Mg2+ (ĐÚNG).`
    });
  }

  // --- 3.3 Trả lời ngắn SA (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const mC = (seed % 5) + 1;
    const M_Fe = 56;
    const ansVal = mC * M_Fe;

    list.push({
      id: `chem_sa_${seed}`,
      type: 'sa',
      subject: 'chemistry',
      difficulty: 'medium',
      text: `Tính khối lượng (theo gam) của $n = ${mC} \\, \\text{mol}$ kim loại Sắt (Fe, $M = 56 \\, \\text{g/mol}$).`,
      correctAnswer: ansVal.toString(),
      choices: [ansVal.toString()],
      correct: 0,
      explanation: `$m = n \\cdot M = ${mC} \\cdot 56 = ${ansVal} \\, \\text{g}$.`
    });
  }

  return list;
};

// ============================================================================
// 4. NGÂN HÀNG CÂU HỎI SINH HỌC (>550 câu)
// ============================================================================
export const generateBiologyQuestions = (count = 550) => {
  const list = [];
  const difficulties = ['easy', 'medium', 'hard'];

  // --- 4.1 Trắc nghiệm MCQ (~350 câu) ---
  for (let i = 0; i < 350; i++) {
    const seed = i + 1;
    const diff = difficulties[i % 3];
    let q = {};
    const category = i % 7;

    if (category === 0) {
      // Phân bào & Nguyên phân
      const correctAns = `Kỳ giữa (Metaphase)`;
      const choices = shuffle([
        correctAns,
        `Kỳ đầu (Prophase)`,
        `Kỳ sau (Anaphase)`,
        `Kỳ cuối (Telophase)`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Trong quá trình nguyên phân, nhiễm sắc thể kép co ngắn cực đại và xếp thành 1 hàng trên mặt phẳng xích đạo của thoi phân bào ở kỳ nào?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Ở kỳ giữa, các NST kép co xoắn cực đại và tập trung thành 1 hàng ở mặt phẳng xích đạo.`
      };
    } else if (category === 1) {
      // Di truyền Mendel
      const correctAns = `3 Trội : 1 Lặn (75% trội : 25% lặn)`;
      const choices = shuffle([
        correctAns,
        `1 Trội : 1 Lặn`,
        `100% Trội`,
        `1 AA : 2 Aa : 1 aa`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Trong phép lai một cặp tính trạng của Mendel, khi cho cây F1 $Aa$ tự thụ phấn, tỉ lệ phân ly kiểu hình ở đời F2 thu được là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Phép lai $Aa \\times Aa \\rightarrow 1AA : 2Aa : 1aa \\Rightarrow$ Tỉ lệ kiểu hình là 3 Trội : 1 Lặn.`
      };
    } else if (category === 2) {
      // Cấu trúc ADN & Gen
      const A = ((seed % 5) + 2) * 100;
      const G = ((seed % 4) + 1) * 100;
      const totalN = (A + G) * 2;

      const correctAns = `$N = ${totalN} \\, \\text{nucleotide}$`;
      const choices = shuffle([
        correctAns,
        `$N = ${totalN / 2} \\, \\text{nucleotide}$`,
        `$N = ${totalN * 2} \\, \\text{nucleotide}$`,
        `$N = ${A + G} \\, \\text{nucleotide}$`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Một phân tử ADN có số nucleotide loại Adenine $A = ${A}$ và Guanine $G = ${G}$. Tổng số nucleotide $N$ của ADN đó là:`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Theo nguyên tắc bổ sung $A = T, G = X \\Rightarrow N = 2A + 2G = 2(${A} + ${G}) = ${totalN}$.`
      };
    } else if (category === 3) {
      // Bào quan tế bào
      const correctAns = `Ty thể (Mitochondria)`;
      const choices = shuffle([
        correctAns,
        `Lục lạp`,
        `Ribosome`,
        `Bộ máy Golgi`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Bào quan nào trong tế bào nhân thực được ví như "nhà máy năng lượng", nơi diễn ra quá trình hô hấp tế bào tổng hợp ATP?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Ty thể thực hiện hô hấp hiếu khí chuyển hóa năng lượng dinh dưỡng thành ATP.`
      };
    } else if (category === 4) {
      // Quang hợp ở thực vật
      const correctAns = `Thylakoid (Màng thylakoid)`;
      const choices = shuffle([
        correctAns,
        `Chất nền Stroma`,
        `Tế bào chất`,
        `Màng ngoài lục lạp`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Pha sáng của quá trình quang hợp ở thực vật diễn ra tại vị trí nào trong lục lạp?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Pha sáng diễn ra tại màng Thylakoid nhờ hệ diệp lục hấp thụ năng lượng ánh sáng.`
      };
    } else if (category === 5) {
      // Đột biến gen & NST
      const correctAns = `Đột biến thay thế 1 cặp nucleotide`;
      const choices = shuffle([
        correctAns,
        `Đột biến mất 1 cặp nucleotide`,
        `Đột biến thêm 1 cặp nucleotide`,
        `Đột biến đảo đoạn NST`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Dạng đột biến điểm nào sau đây làm thay đổi thành phần một codon nhưng không làm dịch chuyển khung đọc của các codon phía sau?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Đột biến thay thế cặp nucleotit chỉ ảnh hưởng đến đúng 1 codon tại vị trí đột biến.`
      };
    } else {
      // Sinh thái học
      const correctAns = `Sinh vật sản xuất (Thực vật xanh)`;
      const choices = shuffle([
        correctAns,
        `Sinh vật tiêu thụ bậc 1`,
        `Sinh vật phân giải`,
        `Sinh vật tiêu thụ bậc 2`
      ]);

      q = {
        type: 'mcq',
        subject: 'biology',
        difficulty: diff,
        text: `Trong một chuỗi thức ăn điển hình trên cạn, mắt xích đầu tiên luôn thuộc về nhóm sinh vật nào?`,
        choices,
        correct: choices.indexOf(correctAns),
        explanation: `Sinh vật sản xuất (thực vật) tự dưỡng tổng hợp chất hữu cơ đầu tiên cho toàn hệ sinh thái.`
      };
    }

    list.push({ ...q, id: `bio_mcq_${seed}` });
  }

  // --- 4.2 Đúng / Sai TF (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const st1 = `ARN polymerase trượt trên mạch khuôn ADN theo chiều $3' \\rightarrow 5'$.`;
    const st2 = `Giảm phân tạo ra 4 tế bào con có bộ NST đơn bội ($n$).`;
    const st3 = `Mọi codon đều mã hóa cho axit amin.`;
    const st4 = `Quang hợp giải phóng khí Oxy ra môi trường từ phân tử $\\text{H}_2\\text{O}$.`;

    list.push({
      id: `bio_tf_${seed}`,
      type: 'tf',
      subject: 'biology',
      difficulty: 'medium',
      text: `Cho các mệnh đề Sinh học sau. Xác định tính Đúng/Sai của từng nhận định:`,
      statements: [st1, st2, st3, st4],
      correct: [true, true, false, true],
      choices: [
        `a) ${st1} -> Đúng`,
        `b) ${st2} -> Đúng`,
        `c) ${st3} -> Sai`,
        `d) ${st4} -> Đúng`
      ],
      explanation: `a) ARN polymerase đi $3' \\rightarrow 5'$ trên mạch khuôn (ĐÚNG). b) Giảm phân tạo 4 tế bào $n$ (ĐÚNG). c) Các codon kết thúc UAA, UAG, UGA KHÔNG mã hóa axit amin (SAI). d) $\\text{O}_2$ sinh ra từ quang phân phân tử $\\text{H}_2\\text{O}$ trong pha sáng (ĐÚNG).`
    });
  }

  // --- 4.3 Trả lời ngắn SA (~100 câu) ---
  for (let i = 0; i < 100; i++) {
    const seed = i + 1;
    const n = (seed % 6) + 1;
    const ansVal = Math.pow(2, n);

    list.push({
      id: `bio_sa_${seed}`,
      type: 'sa',
      subject: 'biology',
      difficulty: 'easy',
      text: `Một tế bào sinh dưỡng trải qua $k = ${n}$ lần nguyên phân liên tiếp. Hỏi có bao nhiêu tế bào con được tạo thành?`,
      correctAnswer: ansVal.toString(),
      choices: [ansVal.toString()],
      correct: 0,
      explanation: `Số tế bào con tạo thành $= 2^k = 2^{${n}} = ${ansVal}$.`
    });
  }

  return list;
};

// ============================================================================
// HÀM TỔNG HỢP SINH CÂU HỎI TẤT CẢ CÁC MÔN (>2200 CÂU)
// ============================================================================
export const generateAllSubjectQuestions = () => {
  console.log("⚡ [AI Generator] Bắt đầu khởi tạo hơn 2.200 câu hỏi tự động cho 4 môn STEM...");
  const math = generateMathQuestions(550);
  const physics = generatePhysicsQuestions(550);
  const chemistry = generateChemistryQuestions(550);
  const biology = generateBiologyQuestions(550);

  const totalCount = math.length + physics.length + chemistry.length + biology.length;
  console.log(`✅ [AI Generator] Đã sinh thành công ${totalCount} câu hỏi (Toán: ${math.length}, Lý: ${physics.length}, Hóa: ${chemistry.length}, Sinh: ${biology.length}).`);

  return {
    math,
    physics,
    chemistry,
    biology,
    all: [...math, ...physics, ...chemistry, ...biology]
  };
};
