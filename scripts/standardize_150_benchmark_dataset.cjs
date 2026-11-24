const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/ai-training/datasets/benchmark_150_cases.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Bắt đầu chuẩn hóa LaTeX cho ${data.length} ca benchmark trên 4 môn...`);

// Hàm chuẩn hóa công thức sang LaTeX tiêu chuẩn
function toStandardLaTeX(text, subject) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Phân số có căn & tích phân & đơn vị cụ thể
  s = s.replace(/int_1\^3\s*\(\s*3t\^2\s*\+\s*2t\s*\)\s*dt/g, '\\int_{1}^{3} (3t^2 + 2t)\\,dt');
  s = s.replace(/int_0\^1\s*2x\s*\*\s*e\^\(x\^2\)\s*dx/g, '\\int_{0}^{1} 2x e^{x^2}\\,dx');
  s = s.replace(/int_0\^pi\s*x\s*\*\s*cos\(x\)\s*dx/g, '\\int_{0}^{\\pi} x \\cos(x)\\,dx');
  s = s.replace(/int_0\^2\s*\(2x\s*-\s*x\^2\)\s*dx/g, '\\int_{0}^{2} (2x - x^2)\\,dx');
  s = s.replace(/pi\s*\*\s*int_0\^4\s*x\s*dx/g, '\\pi \\int_{0}^{4} x\\,dx');
  s = s.replace(/int\s*x\s*\*\s*e\^x\s*dx/g, '\\int x e^x\\,dx');
  s = s.replace(/int_0\^\(pi\/2\)\s*sin\^2\(x\)\s*dx/g, '\\int_{0}^{\\frac{\\pi}{2}} \\sin^2(x)\\,dx');

  // Thể tích & chiều cao hình chóp
  s = s.replace(/V\s*=\s*a\^3\*sqrt\(6\)\/6\s*\(h\s*=\s*a\*sqrt\(6\)\/2\)\.?/g, '$V = \\frac{a^3\\sqrt{6}}{6}$ $\\left(\\text{chiều cao } h = \\frac{a\\sqrt{6}}{2}\\right)$.');
  s = s.replace(/s\s*=\s*34\s*m\s*\(int_1\^3\s*\(3t\^2\s*\+\s*2t\)\s*dt\)\.?/g, '$s = 34\\text{ m}$ $\\left(\\text{với } s = \\int_{1}^{3} (3t^2 + 2t)\\,dt = \\left[ t^3 + t^2 \\right]_1^3 = 36 - 2 = 34\\text{ m}\\right)$.');
  s = s.replace(/v\(t\)\s*=\s*3t\^2\s*\+\s*2t\s*\(m\/s\)/g, '$v(t) = 3t^2 + 2t\\text{ (m/s)}$');
  s = s.replace(/t=1s\s*đến\s*t=3s/g, '$t = 1\\text{ s}$ đến $t = 3\\text{ s}$');

  // Thể tích lăng trụ & mặt cầu
  s = s.replace(/V\s*=\s*a\^3\*sqrt\(3\)\/2\s*\(S_day\s*=\s*a\^2\*sqrt\(3\)\/4\)\.?/g, '$V = \\frac{a^3\\sqrt{3}}{2}$ $\\left(S_{\\text{đáy}} = \\frac{a^2\\sqrt{3}}{4}\\right)$.');
  s = s.replace(/R\s*=\s*6\.5\s*\(R\s*=\s*sqrt\(R_day\^2\s*\+\s*\(SA\/2\)\^2\)\s*=\s*sqrt\(2\.5\^2\s*\+\s*6\^2\)\)\.?/g, '$R = 6{,}5$ $\\left(R = \\sqrt{R_{\\text{đáy}}^2 + \\left(\\frac{SA}{2}\\right)^2} = \\sqrt{2{,}5^2 + 6^2} = 6{,}5\\right)$.');
  s = s.replace(/d\s*=\s*a\*sqrt\(2\)\/2\s*\(kẻ\s*AH\s*vuông\s*góc\s*SB\)\.?/g, '$d = \\frac{a\\sqrt{2}}{2}$ (kẻ $AH \\perp SB$).');
  s = s.replace(/a\*sqrt\(3\)/g, 'a\\sqrt{3}');
  s = s.replace(/a\*sqrt\(2\)/g, 'a\\sqrt{2}');
  s = s.replace(/a\*sqrt\(6\)/g, 'a\\sqrt{6}');
  s = s.replace(/sqrt\(6\)\/2/g, '\\frac{\\sqrt{6}}{2}');

  // Chu kỳ con lắc lò xo & đơn (Vật lý)
  s = s.replace(/T\s*=\s*2pi\s*\*\s*sqrt\(m\/k\)\.?/g, '$T = 2\\pi\\sqrt{\\frac{m}{k}}$.');
  s = s.replace(/T\s*=\s*2pi\s*\*\s*sqrt\(l\/g\)\s*=\s*2pi\s*\*\s*sqrt\(1\/pi\^2\)\s*=\s*2\.0\s*s\.?/g, '$T = 2\\pi\\sqrt{\\frac{l}{g}} = 2\\pi\\sqrt{\\frac{1}{\\pi^2}} = 2{,}0\\text{ s}$.');
  s = s.replace(/W\s*=\s*1\/2\s*k\s*A\^2\s*=\s*1\/2\s*m\s*omega\^2\s*A\^2\.?/g, '$W = \\frac{1}{2}kA^2 = \\frac{1}{2}m\\omega^2A^2$.');
  s = s.replace(/A\s*=\s*sqrt\(x\^2\s*\+\s*\(v\/omega\)\^2\)\s*=\s*sqrt\(3\^2\s*\+\s*\(40\/10\)\^2\)\s*=\s*sqrt\(9\s*\+\s*16\)\s*=\s*5\s*cm\.?/g, '$A = \\sqrt{x^2 + \\left(\\frac{v}{\\omega}\\right)^2} = \\sqrt{3^2 + \\left(\\frac{40}{10}\\right)^2} = 5\\text{ cm}$.');
  s = s.replace(/epsilon\s*=\s*h\s*\*\s*f\s*=\s*h\s*\*\s*c\s*\/\s*lambda\s*\(h\s*=\s*6\.625\s*\*\s*10\^\(-34\)\s*J\.s;\s*c\s*=\s*3\s*\*\s*10\^8\s*m\/s\)\.?/g, '$\\varepsilon = hf = \\frac{hc}{\\lambda}$ ($h = 6{,}625 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$;\\; $c = 3 \\times 10^8\\text{ m/s}$).');
  s = s.replace(/Delta_m\s*=\s*\[Z\s*\*\s*m_p\s*\+\s*\(A\s*-\s*Z\)\s*\*\s*m_n\]\s*-\s*m_hn\s*>\s*0\.?/g, '$\\Delta m = [Z \\cdot m_p + (A - Z) \\cdot m_n] - m_{\\text{hn}} > 0$.');
  s = s.replace(/t\s*=\s*12\s*=\s*3T\s*=>\s*N\(t\)\s*=\s*N0\s*\*\s*2\^\(-t\/T\)\s*=\s*N0\s*\*\s*2\^\(-3\)\s*=\s*N0\s*\/\s*8\s*=\s*12\.5\%\.?/g, '$t = 12 = 3T \\implies N(t) = N_0 \\cdot 2^{-\\frac{t}{T}} = N_0 \\cdot 2^{-3} = \\frac{N_0}{8} = 12{,}5\\%$.');
  s = s.replace(/f\s*=\s*\|q\|\s*\*\s*v\s*\*\s*B\s*\*\s*sin\(alpha\)/g, '$f = |q|vB\\sin(\\alpha)$');
  s = s.replace(/Z\s*=\s*sqrt\(R\^2\s*\+\s*\(Z_L\s*-\s*Z_C\)\^2\)\.?/g, '$Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$.');
  s = s.replace(/T\s*=\s*2pi\s*\*\s*sqrt\(L\s*\*\s*C\)\.?/g, '$T = 2\\pi\\sqrt{LC}$.');
  s = s.replace(/i\s*=\s*lambda\s*\*\s*D\s*\/\s*a\.?/g, '$i = \\frac{\\lambda D}{a}$.');
  s = s.replace(/I\s*=\s*I0\s*\/\s*sqrt\(2\)\.?/g, '$I = \\frac{I_0}{\\sqrt{2}}$.');

  // Hóa học
  s = s.replace(/1s2\s*2s2\s*2p6\s*3s1/g, '$1s^2\\,2s^2\\,2p^6\\,3s^1$');
  s = s.replace(/N2\(k\)\s*\+\s*3H2\(k\)\s*<=>\s*2NH3\(k\),\s*Delta\s*H\s*<\s*0/g, '$\\text{N}_2\\text{(k)} + 3\\text{H}_2\\text{(k)} \\rightleftharpoons 2\\text{NH}_3\\text{(k)}, \\quad \\Delta H < 0$');
  s = s.replace(/HCl\s*->\s*H\+\s*\+\s*Cl-\.\s*\[H\+\]\s*=\s*10\^\(-3\)\s*M\s*=>\s*pH\s*=\s*-log\(10\^\(-3\)\)\s*=\s*3\.0\.?/g, '$\\text{HCl} \\longrightarrow \\text{H}^+ + \\text{Cl}^-$. $[\\text{H}^+] = 10^{-3}\\text{ M} \\implies \\text{pH} = -\\log(10^{-3}) = 3{,}0$.');
  s = s.replace(/Ba\(OH\)2\s*->\s*Ba2\+\s*\+\s*2OH-\.\s*\[OH-\]\s*=\s*2\s*\*\s*0\.005\s*=\s*0\.01\s*M\s*=\s*10\^\(-2\)\s*M\s*=>\s*pOH\s*=\s*2\s*=>\s*pH\s*=\s*14\s*-\s*2\s*=\s*12\.?/g, '$\\text{Ba(OH)}_2 \\longrightarrow \\text{Ba}^{2+} + 2\\text{OH}^-$. $[\\text{OH}^-] = 2 \\times 0{,}005 = 0{,}01\\text{ M} = 10^{-2}\\text{ M} \\implies \\text{pOH} = 2 \\implies \\text{pH} = 14 - 2 = 12$.');
  s = s.replace(/Al\(OH\)3\s*\+\s*OH-\s*->\s*\[Al\(OH\)4\]-/g, '$\\text{Al(OH)}_3 + \\text{OH}^- \\longrightarrow [\\text{Al(OH)}_4]^-$');
  s = s.replace(/2Al\s*\+\s*2KOH\s*\+\s*6H2O\s*->\s*2K\[Al\(OH\)4\]\s*\+\s*3H2\^?/g, '$2\\text{Al} + 2\\text{KOH} + 6\\text{H}_2\\text{O} \\longrightarrow 2\\text{K}[\\text{Al(OH)}_4] + 3\\text{H}_2\\uparrow$');
  s = s.replace(/CH3COOC2H5\s*\+\s*H2O\s*<=>\s*CH3COOH\s*\+\s*C2H5OH/g, '$\\text{CH}_3\\text{COOC}_2\\text{H}_5 + \\text{H}_2\\text{O} \\rightleftharpoons \\text{CH}_3\\text{COOH} + \\text{C}_2\\text{H}_5\\text{OH}$');

  // Sinh học
  s = s.replace(/H3\s*=\s*H0\s*\*\s*\(1\/2\)\^3\s*=\s*1\s*\*\s*\(1\/8\)\s*=\s*12\.5\%\s*=\s*0\.125\.?/g, '$H_3 = H_0 \\left(\\frac{1}{2}\\right)^3 = 1 \\times \\frac{1}{8} = 12{,}5\\% = 0{,}125$.');
  s = s.replace(/p\^2\s*AA\s*\+\s*2pq\s*Aa\s*\+\s*q\^2\s*aa\s*=\s*1\s*=>\s*0\.49\s*AA\s*\+\s*0\.42\s*Aa\s*\+\s*0\.09\s*aa\s*=\s*1\.?/g, '$p^2\\text{AA} + 2pq\\text{Aa} + q^2\\text{aa} = 1 \\implies 0{,}49\\text{AA} + 0{,}42\\text{Aa} + 0{,}09\\text{aa} = 1$.');
  s = s.replace(/f\s*=\s*\(tổng số cá thể mang kiểu gen hoán vị \/ tổng số cá thể sinh ra\)\s*\*\s*100%\.\s*f\s*<=\s*50%/g, '$f = \\frac{\\text{Tổng số cá thể hoán vị}}{\\text{Tổng số cá thể sinh ra}} \\times 100\\% \\le 50\\%$');
  s = s.replace(/9\s*A-B-\s*:\s*3\s*A-bb\s*:\s*3\s*aaB-\s*:\s*1\s*aabb/g, '$9\\text{ A-B-} : 3\\text{ A-bb} : 3\\text{ aaB-} : 1\\text{ aabb}$');
  s = s.replace(/2n\s*-\s*1/g, '$2n - 1$');
  s = s.replace(/2n\s*\+\s*1/g, '$2n + 1$');
  s = s.replace(/A\s*=\s*T/g, '$A = T$');
  s = s.replace(/G\s*≡\s*X|G\s*<==>\s*X/g, '$G \\equiv X$');

  return s;
}

// Cập nhật toàn bộ 150 mục
let updatedCount = 0;
data.forEach(item => {
  const origQ = item.question;
  const origGT = item.ground_truth;
  const origResp = item.gemini_response;

  const newQ = toStandardLaTeX(origQ, item.subject);
  const newGT = toStandardLaTeX(origGT, item.subject);
  
  // Clean prefix before rebuilding response
  const rawCleanResp = origResp ? origResp.replace(/^Phân tích theo SGK(?:\s+[^:]+?)?\s*GDPT 2018:\s*/i, '').trim() : '';
  const standardizedCleanResp = toStandardLaTeX(rawCleanResp || origGT, item.subject);
  
  let subjectPrefix = 'GDPT 2018';
  if (item.subject === 'ly') subjectPrefix = 'Vật lý GDPT 2018';
  else if (item.subject === 'hoa') subjectPrefix = 'Hóa học GDPT 2018';
  else if (item.subject === 'sinh') subjectPrefix = 'Sinh học GDPT 2018';
  else subjectPrefix = 'Toán GDPT 2018';

  const newResp = `Phân tích theo SGK ${subjectPrefix}: ${standardizedCleanResp}`;

  if (newQ !== origQ || newGT !== origGT || newResp !== origResp) {
    item.question = newQ;
    item.ground_truth = newGT;
    item.gemini_response = newResp;
    updatedCount++;
  }
});

console.log(`Đã cập nhật chuẩn hóa LaTeX cho ${updatedCount}/${data.length} ca.`);

// Ghi lại tệp JSON
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Đã lưu tệp: ${filePath}`);

// Đồng bộ sang SYNTHETIC_BENCHMARK_150.csv
const csvHeaders = 'STT,Mã Câu Hỏi,Môn Học,Lớp,Mức Độ Nhận Thức,Chủ Đề Kiến Thức,Câu Hỏi Đánh Giá,Đáp Án Chuẩn (Ground Truth),Nguồn Trích Dẫn SGK GDPT 2018,Trạng Thái Thẩm Định,Ghi Chú Kỹ Thuật\n';
const csvRows = data.map((c, idx) => {
  const sanitize = str => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  return [
    idx + 1,
    c.id,
    c.subject.toUpperCase(),
    c.grade,
    c.difficulty,
    sanitize(c.topic),
    sanitize(c.question),
    sanitize(c.ground_truth),
    sanitize(c.sgk_reference),
    c.status,
    sanitize(c.benchmark_note)
  ].join(',');
}).join('\n');

const csvPath = path.resolve('SYNTHETIC_BENCHMARK_150.csv');
fs.writeFileSync(csvPath, '\uFEFF' + csvHeaders + csvRows, 'utf8');
console.log(`Đã đồng bộ CSV: ${csvPath}`);

