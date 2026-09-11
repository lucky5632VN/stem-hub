import katex from 'katex';

/**
 * Tự động phát hiện và chuyển đổi pseudo-LaTeX (thiếu backslash hoặc thiếu ngoặc nhọn)
 * thành LaTeX chuẩn mực hoặc ký hiệu toán học tự nhiên đẹp mắt.
 */
function repairPseudoLatex(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Nếu có các dòng ngắt vụn chỉ chứa \cdot hoặc = ở đầu dòng nối tiếp
  // Gộp các dòng bị ngắt công thức ngớ ngẩn lại
  s = s.replace(/\n\s*(\\cdot|·)\s*\n/g, ' · ');
  s = s.replace(/=\s*\n\s*/g, ' = ');
  s = s.replace(/\n\s*(\\cdot|·)\s*/g, ' · ');

  // 2. Chuyển đổi các dạng phân số pseudo:
  // "frac a^2 sqrt 3 4" -> "\frac{a^2\sqrt{3}}{4}"
  // "frac a^3 sqrt 2 4" -> "\frac{a^3\sqrt{2}}{4}"
  // "frac a sqrt 6 3" -> "\frac{a\sqrt{6}}{3}"
  // "frac a^2 3" -> "\frac{a^2}{3}"
  // "frac 1 2" -> "\frac{1}{2}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/g, (match, num, den) => {
    // Làm sạch num: nếu num có sqrt mà thiếu backslash:
    let cleanNum = num.replace(/\bsqrt\s*(\d+)/g, '\\sqrt{$1}').replace(/\bsqrt\b/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 3. Chuyển đổi "sqrt AA'^2 - AG^2" hoặc "sqrt a^2 - \frac{a^2}{3}"
  // Khi sqrt không có backslash hoặc không có ngoặc nhọn
  s = s.replace(/\bsqrt\s+([A-Za-z0-9'^]+(?:\s*-\s*[A-Za-z0-9'^]+|\s*\+\s*[A-Za-z0-9'^]+))\b/g, '\\sqrt{$1}');
  s = s.replace(/\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  s = s.replace(/\bsqrt\s*(\d+)/g, '\\sqrt{$1}');

  // 4. Nếu còn sót "frac {a}{b}" mà thiếu backslash
  s = s.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  s = s.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');

  // 5. Nếu các dòng là chuỗi công thức thuần túy chưa có $ hoặc $$, tự động bọc $$ hoặc $
  // Ví dụ dòng bắt đầu bằng: A'G = ... hoặc V = ...
  s = s.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G)\s*=\s*[\s\S]+?)$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#')) {
      return line;
    }
    // Nếu dòng chứa ký hiệu toán học như \frac, \sqrt, \cdot, ^, =, Δ, \Delta
    if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
      return `$$${trimmed}$$`;
    }
    return line;
  });

  return s;
}

const inputSample = `A'G là:
A'G =
sqrt AA'^2 - AG^2 =
sqrt a^2 - frac a^2 3 =
frac a sqrt 6 3
Vậy thể tích khối lăng trụ ABC.A'B'C' là:

V = S_{\\Delta ABC}
\\cdot A'G =
frac a^2 sqrt 3 4
\\cdot
frac a sqrt 6 3 =
frac a^3 sqrt 2 4`;

console.log('--- REPAIRED TEXT ---');
const repaired = repairPseudoLatex(inputSample);
console.log(repaired);

console.log('\n--- KATEX RENDERING TEST ON REPAIRED FORMULA ---');
// Render each $$...$$ block
const blocks = repaired.match(/\$\$([\s\S]+?)\$\$/g) || [];
blocks.forEach((b, i) => {
  const content = b.replace(/\$\$/g, '').trim();
  console.log(`Block ${i + 1} content:`, content);
  const html = katex.renderToString(content, { displayMode: true, throwOnError: false });
  console.log(`Block ${i + 1} KaTeX valid:`, !html.includes('katex-error'));
});
