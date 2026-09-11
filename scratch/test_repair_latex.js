const text = `A'G là:
A'G =
sqrt AA'^2 - AG^2 =
sqrt a^2 - frac a^2 3 =
frac a sqrt 6 3

Vậy thể tích khối lăng trụ ABC.A'B'C' là:

V = S_{DeltaABC}
cdot A'G =
frac a^2 sqrt 3 4
cdot
frac a sqrt 6 3 =
frac a^3 sqrt 2 4`;

function repairPseudoLatex(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Dọn dẹp ký tự Form Feed / Backspace nếu có từ JSON parse
  s = s.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');

  // 2. Nối các dòng công thức bị ngắt vụn quanh dấu =, \cdot, cdot, +, -
  // Ví dụ: "\ncdot A'G" -> " \\cdot A'G", "\ncdot\n" -> " \\cdot "
  s = s.replace(/\n\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/\n\s*(\\?cdot|·)\s*/g, ' \\cdot ');
  s = s.replace(/\s*(\\?cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/=\s*\n\s*/g, ' = ');
  s = s.replace(/\n\s*=\s*/g, ' = ');

  // 3. Chuẩn hóa DeltaABC -> \Delta ABC
  s = s.replace(/(?<!\\)\bDelta([A-Z]+)/g, '\\Delta $1');
  s = s.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

  // 4. Chuẩn hóa pseudo-fraction phức: "frac a^2 sqrt 3 4" -> "\frac{a^2\sqrt{3}}{4}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/g, (_match, num, den) => {
    const cleanNum = num
      .replace(/(?:\\?sqrt|√)\s*(\d+)/g, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 5. Chuẩn hóa pseudo-fraction có tích hoặc căn ở tử: "frac a sqrt 6 3" -> "\frac{a\sqrt{6}}{3}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+))\s+(\d+)\b/g, (_match, num, den) => {
    const cleanNum = num
      .replace(/(?:\\?sqrt|√)\s*(\d+)/g, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 6. Chuẩn hóa pseudo-fraction cơ bản: "frac a^2 3" -> "\frac{a^2}{3}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
    return `\\frac{${num}}{${den}}`;
  });

  // 7. Chuẩn hóa pseudo-sqrt:
  // "sqrt AA'^2 - AG^2" -> "\sqrt{AA'^2 - AG^2}"
  s = s.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
  // "sqrt a^2 - \frac{a^2}{3}" -> "\sqrt{a^2 - \frac{a^2}{3}}"
  s = s.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

  // 8. Sửa thiếu gạch chéo \frac{ và \sqrt{ và \cdot
  s = s.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  s = s.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  s = s.replace(/(?<!\\)\bcdot\b/g, '\\cdot');

  // 9. Bọc các dòng đẳng thức độc lập thành $$...$$ nếu chưa có bọc
  s = s.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G)\s*=\s*[\s\S]+?)$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
      return line;
    }
    if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
      return `$$${trimmed}$$`;
    }
    return line;
  });

  return s;
}

console.log('--- RESULT ---');
const repaired = repairPseudoLatex(text);
console.log(repaired);

try {
  const katex = require('e:/project/cuoc_thi_AI/public/labs/toan/frontend/node_modules/katex');
  // Check display formula rendering
  const formula = "A'G = \\sqrt{AA'^2 - AG^2} = \\sqrt{a^2 - \\frac{a^2}{3}} = \\frac{a\\sqrt{6}}{3}";
  let rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
  console.log('Raw KaTeX contains newline:', rendered.includes('\n'));
  let cleaned = rendered.replace(/\r?\n/g, ' ');
  console.log('Cleaned KaTeX contains newline:', cleaned.includes('\n'));
  console.log('Path tag exists:', cleaned.includes('<path d='));
} catch (e) {
  console.error(e);
}
