import katex from 'katex';

export function repairPseudoLatex(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Dọn dẹp ký tự Form Feed / Backspace nếu có
  s = s.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');

  // 2. Gộp các dòng bị ngắt vụn công thức đứng một mình (dấu = hoặc \cdot)
  s = s.replace(/\n\s*(\\cdot|·)\s*\n/g, ' \\cdot ');
  s = s.replace(/=\s*\n\s*/g, ' = ');
  s = s.replace(/\n\s*(\\cdot|·)\s*/g, ' \\cdot ');

  // 3. Chuẩn hóa pseudo-fraction: "frac a^2 sqrt 3 4" -> "\frac{a^2\sqrt{3}}{4}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/g, (_match, num, den) => {
    let cleanNum = num
      .replace(/(?:\\?sqrt|√)\s*(\d+)/g, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  // 4. Chuẩn hóa pseudo-fraction dạng cơ bản: "frac a^2 3" -> "\frac{a^2}{3}"
  s = s.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
    return `\\frac{${num}}{${den}}`;
  });

  // 5. Chuẩn hóa pseudo-sqrt: "sqrt AA'^2 - AG^2" -> "\sqrt{AA'^2 - AG^2}"
  s = s.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
  s = s.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

  // 6. Sửa thiếu gạch chéo \frac{ và \sqrt{
  s = s.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  s = s.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  s = s.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
  s = s.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

  // 7. Bọc các dòng đẳng thức độc lập thành $$...$$ nếu chưa có bọc
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

// Test case 1: The exact screenshot text
const testCase1 = `A'G là:
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

console.log('=== TEST CASE 1 ===');
const rep1 = repairPseudoLatex(testCase1);
console.log(rep1);

// Test case 2: Standard LaTeX text (should remain intact)
const testCase2 = `Diện tích tam giác đáy:
$$S_{ABC} = \\frac{a^2\\sqrt{3}}{4}$$

Thể tích:
$$V = S_{ABC} \\cdot A'G = \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{a\\sqrt{6}}{3} = \\frac{a^3\\sqrt{2}}{4}$$`;

console.log('\n=== TEST CASE 2 ===');
const rep2 = repairPseudoLatex(testCase2);
console.log(rep2);

// Test KaTeX on all blocks
console.log('\n=== KATEX COMPATIBILITY CHECK ===');
const allBlocks = (rep1 + '\n' + rep2).match(/\$\$([\s\S]+?)\$\$/g) || [];
allBlocks.forEach((b, i) => {
  const content = b.replace(/\$\$/g, '').trim();
  const html = katex.renderToString(content, { displayMode: true, throwOnError: false, strict: 'ignore' });
  console.log(`Block ${i + 1}: ${content.substring(0, 35)}... -> Rendered length: ${html.length}`);
});
