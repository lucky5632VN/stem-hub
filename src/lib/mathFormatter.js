import katex from 'katex';

/**
 * Universal Math, Physics, Chemistry, Biology & STEM Formatter for STEM HUB
 * Transforms raw ASCII, shorthand, and LaTeX formulas (\dfrac, \frac, \sqrt, \begin{cases}, \pi, \alpha, \omega, isotopes, etc.)
 * into beautifully styled DOM elements using KaTeX with inline-block fallbacks & Unicode symbol mappings.
 */

// Safe KaTeX renderer wrapper
const renderKaTeXSafe = (latex, displayMode = false) => {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'html'
    });
  } catch (e) {
    return latex;
  }
};

// Subscript and Superscript Maps for Unicode Fallbacks
export const subscriptMap = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'a': 'ₐ', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ', 'y': 'y', 'z': 'z',
  'A': 'ₐ', 'M': 'ₘ', 'N': 'ₙ', 'B': 'b', 'L': 'ₗ', 'C': 'c', 'P': 'ₚ', 'S': 'ₛ', 'T': 'ₜ',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
};

export const superscriptMap = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'm': 'ᵐ', 'k': 'ᵏ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ'
};

// Map LaTeX symbols to Unicode for text outside KaTeX
const latexTranslations = [
  { regex: /\\text\{\s*(.*?)\s*\}/g, replacement: '$1' },
  { regex: /\\left/g, replacement: '' },
  { regex: /\\right/g, replacement: '' },
  { regex: /\\pi/g, replacement: 'π' },
  { regex: /\\lambda/g, replacement: 'λ' },
  { regex: /\\mu/g, replacement: 'μ' },
  { regex: /\\alpha/g, replacement: 'α' },
  { regex: /\\beta/g, replacement: 'β' },
  { regex: /\\gamma/g, replacement: 'γ' },
  { regex: /\\delta/g, replacement: 'δ' },
  { regex: /\\epsilon/g, replacement: 'ε' },
  { regex: /\\varepsilon/g, replacement: 'ε' },
  { regex: /\\varphi/g, replacement: 'φ' },
  { regex: /\\phi/g, replacement: 'φ' },
  { regex: /\\omega/g, replacement: 'ω' },
  { regex: /\\theta/g, replacement: 'θ' },
  { regex: /\\eta/g, replacement: 'η' },
  { regex: /\\rho/g, replacement: 'ρ' },
  { regex: /\\sigma/g, replacement: 'σ' },
  { regex: /\\tau/g, replacement: 'τ' },
  { regex: /\\Delta/g, replacement: 'Δ' },
  { regex: /\\Omega/g, replacement: 'Ω' },
  { regex: /\^\\circ/g, replacement: '°' },
  { regex: /\\circ/g, replacement: '°' },
  { regex: /\\degree/g, replacement: '°' },
  { regex: /<=>|<==>|\\rightleftharpoons/g, replacement: ' ⇌ ' },
  { regex: /-->|->|\\rightarrow|\\to/g, replacement: ' → ' },
  { regex: /=>|\\Rightarrow/g, replacement: ' ⇒ ' },
  { regex: /<=|\\Leftarrow/g, replacement: ' ⇐ ' },
  { regex: /<=>|\\Leftrightarrow/g, replacement: ' ⇔ ' },
  { regex: /\\times/g, replacement: ' × ' },
  { regex: /\\approx/g, replacement: ' ≈ ' },
  { regex: /\\cdot/g, replacement: ' · ' },
  { regex: /\\pm|\+-/g, replacement: '±' },
  { regex: /\\neq|!=/g, replacement: '≠' },
  { regex: /\\infty/g, replacement: '∞' },
  { regex: /\\cup/g, replacement: ' ∪ ' },
  { regex: /\\cap/g, replacement: ' ∩ ' },
  { regex: /\\le\b|\\leq/g, replacement: '≤' },
  { regex: /\\ge\b|\\geq/g, replacement: '≥' },
  { regex: /\\perp/g, replacement: '⊥' },
  { regex: /\\parallel/g, replacement: '∥' },
  { regex: /\\int/g, replacement: '∫' },
  { regex: /\\in\b/g, replacement: ' ∈ ' },
  { regex: /\\notin\b/g, replacement: ' ∉ ' },
  { regex: /\\subset\b/g, replacement: ' ⊂ ' },
  { regex: /\\subseteq\b/g, replacement: ' ⊆ ' },
  { regex: /\\forall/g, replacement: '∀' },
  { regex: /\\exists/g, replacement: '∃' },
  { regex: /\\emptyset|\\varnothing/g, replacement: '∅' },
  { regex: /\\setminus/g, replacement: ' ∖ ' },
  { regex: /\\uparrow/g, replacement: '↑' },
  { regex: /\\downarrow/g, replacement: '↓' },
  { regex: /\\mid\b/g, replacement: ' | ' },
  { regex: /\\\{/g, replacement: '{' },
  { regex: /\\\}/g, replacement: '}' },
  { regex: /\\mathbb\{R\}/g, replacement: 'ℝ' },
  { regex: /\\mathbb\{C\}/g, replacement: 'ℂ' },
  { regex: /\\mathbb\{N\}/g, replacement: 'ℕ' },
  { regex: /\\mathbb\{Z\}/g, replacement: 'ℤ' },
  { regex: /\\log/g, replacement: 'log' },
  { regex: /\\ln/g, replacement: 'ln' },
  { regex: /\\sin/g, replacement: 'sin' },
  { regex: /\\cos/g, replacement: 'cos' },
  { regex: /\\tan/g, replacement: 'tan' },
  { regex: /\\cot/g, replacement: 'cot' },
  { regex: /\\vec\{([^}]+)\}/g, replacement: 'vectơ $1' },
  { regex: /\\overrightarrow\{([^}]+)\}/g, replacement: 'vectơ $1' },
  { regex: /\\overline\{([^}]+)\}/g, replacement: '$1' },
  { regex: /\\,/g, replacement: ' ' },
  { regex: /\\;/g, replacement: ' ' },
  { regex: /\\quad/g, replacement: ' ' },
  { regex: /\\qquad/g, replacement: ' ' }
];

export const formatMathText = (text) => {
  if (!text || typeof text !== 'string') return '';

  let formatted = text;

  // 1. Dọn dẹp thẻ rác cũ & ký tự thừa
  formatted = formatted.replace(/#colorend/g, '');

  // 1.2 Tự động chuẩn hóa pseudo-LaTeX (thiếu backslash hoặc thiếu ngoặc nhọn)
  formatted = formatted.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b');
  formatted = formatted.replace(/\n\s*(\\cdot|·)\s*\n/g, ' \\cdot ');
  formatted = formatted.replace(/=\s*\n\s*/g, ' = ');
  formatted = formatted.replace(/\n\s*(\\cdot|·)\s*/g, ' \\cdot ');

  formatted = formatted.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+(?:\s*(?:\\?sqrt|√)\s*[0-9a-zA-Z^]+)?)\s+(\d+)\b/g, (_match, num, den) => {
    const cleanNum = num
      .replace(/(?:\\?sqrt|√)\s*(\d+)/g, '\\sqrt{$1}')
      .replace(/(?<!\\)sqrt/g, '\\sqrt');
    return `\\frac{${cleanNum}}{${den}}`;
  });

  formatted = formatted.replace(/\b(?:\\?frac)\s+([a-zA-Z0-9^]+)\s+([a-zA-Z0-9^]+)\b/g, (_match, num, den) => {
    return `\\frac{${num}}{${den}}`;
  });

  formatted = formatted.replace(/(?<!\\)\bsqrt\s+([A-Za-z0-9'^]+(?:\s*[-+]\s*[A-Za-z0-9'^]+)+)\b/g, '\\sqrt{$1}');
  formatted = formatted.replace(/(?<!\\)\bsqrt\s+([a-zA-Z0-9^]+(?:\s*[-+]\s*\\frac\{[^}]+\}\{[^}]+\}))/g, '\\sqrt{$1}');
  formatted = formatted.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
  formatted = formatted.replace(/(?<!\\)\bsqrt\{([^{}]+)\}/g, '\\sqrt{$1}');

  formatted = formatted.replace(/(?<!\\)\bfrac\{/g, '\\frac{');
  formatted = formatted.replace(/(?<!\\)\bsqrt\{/g, '\\sqrt{');
  formatted = formatted.replace(/(?<!\\)\bcdot\b/g, '\\cdot');
  formatted = formatted.replace(/(?<!\\)\bDelta\b/g, '\\Delta');

  formatted = formatted.replace(/^((?:[A-Za-z0-9'_]+|V|S|A'G)\s*=\s*[\s\S]+?)$/gm, (line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('$') || trimmed.startsWith('$$') || trimmed.startsWith('<') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
      return line;
    }
    if (/(\\frac|\\sqrt|\\cdot|·|\^|=|\\Delta|Δ)/.test(trimmed)) {
      return `$$${trimmed}$$`;
    }
    return line;
  });

  // 1.5 Chuẩn hóa các thuật ngữ toán học & khoa học phổ biến của Việt Nam
  formatted = formatted
    .replace(/\bacgumen\b/gi, 'Argument (arg)')
    .replace(/\bmodun\b|\bmôđun\b/gi, 'Môđun (|z|)');

  // 2. Bảo vệ các thẻ HTML token đơn lẻ (<tag...>, </tag>, <img...>)
  const htmlPlaceholders = [];
  
  // a. Bảo vệ thẻ <img> (mã hóa URL an toàn)
  formatted = formatted.replace(/<img\s+([^>]*?)src="([^"]+?)"([^>]*?)>/gi, (match, before, src, after) => {
    const idx = htmlPlaceholders.length;
    const cleanImg = `<img referrerpolicy="no-referrer" ${before}src="${encodeURI(src.trim())}"${after}>`;
    htmlPlaceholders.push(cleanImg);
    return `###HTMLPH${idx}HTMLPH###`;
  });

  // b. Bảo vệ tất cả các thẻ HTML đơn lẻ độc lập (<tag...>, </tag>)
  formatted = formatted.replace(/<[^>]+>/g, (match) => {
    const idx = htmlPlaceholders.length;
    htmlPlaceholders.push(match);
    return `###HTMLPH${idx}HTMLPH###`;
  });

  // 3. Mảng lưu trữ KaTeX đã render để bảo vệ khỏi các regex xử lý tiếp theo
  const katexPlaceholders = [];
  const protectKaTeX = (latex, displayMode = false) => {
    if (!latex || !latex.trim()) return '';
    const html = renderKaTeXSafe(latex.trim(), displayMode);
    const idx = katexPlaceholders.length;
    katexPlaceholders.push(html);
    return `###KATEXPH${idx}KATEXPH###`;
  };

  // a. Render các khối KaTeX Display (Block math $$...$$ và \[...\])
  formatted = formatted.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => protectKaTeX(p1, true));
  formatted = formatted.replace(/\\\[([\s\S]+?)\\\]/g, (match, p1) => protectKaTeX(p1, true));

  // b. Render Môi trường Hệ phương trình / Ma trận / Bảng LaTeX nhiều dòng
  const envNames = ['cases', 'aligned', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'gather', 'equation'];
  envNames.forEach(env => {
    const startTag = `\\begin{${env}}`;
    const endTag = `\\end{${env}}`;
    while (formatted.includes(startTag)) {
      const startIdx = formatted.indexOf(startTag);
      const endIdx = formatted.indexOf(endTag, startIdx);
      if (endIdx === -1) break;
      const fullLen = endTag.length;
      const block = formatted.slice(startIdx, endIdx + fullLen);
      const cleanBlock = block.replace(/\r?\n/g, ' \\\\ ');
      const placeholder = protectKaTeX(cleanBlock, true);
      formatted = formatted.slice(0, startIdx) + placeholder + formatted.slice(endIdx + fullLen);
    }
  });

  // c. Render Inline math \(...\)
  formatted = formatted.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => protectKaTeX(p1, false));

  // d. Render Inline math $...$
  formatted = formatted.replace(/\$([^$]+?)\$/g, (match, p1) => protectKaTeX(p1, false));

  // e. Pre-process cho công thức THÔ KHÔNG BỌC $: Chuyển \int_a^b, ∫_ab, |_ab sang khối KaTeX
  formatted = formatted.replace(/(\\int|∫)_\{?([a-zA-Z0-9]+)\}?\^?\{?([a-zA-Z0-9]+)\}?/g, (match, intSym, lower, upper) => {
    return protectKaTeX(`\\int_{${lower}}^{${upper}}`, false);
  });

  formatted = formatted.replace(/\|_\{?([a-zA-Z0-9]+)\}?\^?\{?([a-zA-Z0-9]+)\}?/g, (match, lower, upper) => {
    return protectKaTeX(`\\Big|_{${lower}}^{${upper}}`, false);
  });

  // Pre-process: Vectơ thô vec(u), vec{u}, \vec u -> KaTeX
  formatted = formatted.replace(/(?:\\vec|vec)\{([^{}]+)\}/gi, (match, vName) => protectKaTeX(`\\vec{${vName}}`, false));
  formatted = formatted.replace(/(?:\\vec|vec)\(([^()]+)\)/gi, (match, vName) => protectKaTeX(`\\vec{${vName}}`, false));

  // e. Render phân số chưa bọc $: \frac{...}{...} và \dfrac{...}{...}
  while (formatted.includes('\\frac{') || formatted.includes('\\dfrac{')) {
    const isDfrac = formatted.includes('\\dfrac{');
    const startToken = isDfrac ? '\\dfrac{' : '\\frac{';
    const startIdx = formatted.indexOf(startToken);
    
    let depth = 0;
    let midIdx = -1;
    for (let i = startIdx + startToken.length; i < formatted.length; i++) {
      if (formatted[i] === '{') depth++;
      else if (formatted[i] === '}') {
        if (depth === 0) { midIdx = i; break; }
        depth--;
      }
    }
    if (midIdx === -1) break;
    const numerator = formatted.slice(startIdx + startToken.length, midIdx);
    if (formatted[midIdx + 1] !== '{') break;
    let endIdx = -1;
    depth = 0;
    for (let i = midIdx + 2; i < formatted.length; i++) {
      if (formatted[i] === '{') depth++;
      else if (formatted[i] === '}') {
        if (depth === 0) { endIdx = i; break; }
        depth--;
      }
    }
    if (endIdx === -1) break;
    const denominator = formatted.slice(midIdx + 2, endIdx);

    const fracLatex = `\\dfrac{${numerator}}{${denominator}}`;
    const placeholder = protectKaTeX(fracLatex, false);
    formatted = formatted.slice(0, startIdx) + placeholder + formatted.slice(endIdx + 1);
  }

  // f. Render căn thức chưa bọc $: \sqrt{...} hoặc \sqrt[n]{...}
  while (formatted.includes('\\sqrt{') || formatted.includes('\\sqrt[')) {
    const isBracket = formatted.includes('\\sqrt[');
    const startToken = isBracket ? '\\sqrt[' : '\\sqrt{';
    const startIdx = formatted.indexOf(startToken);
    if (isBracket) {
      const closeBracketIdx = formatted.indexOf(']', startIdx);
      if (closeBracketIdx !== -1 && formatted[closeBracketIdx + 1] === '{') {
        const rootIndex = formatted.slice(startIdx + 6, closeBracketIdx);
        let depth = 0;
        let endIdx = -1;
        for (let i = closeBracketIdx + 2; i < formatted.length; i++) {
          if (formatted[i] === '{') depth++;
          else if (formatted[i] === '}') {
            if (depth === 0) { endIdx = i; break; }
            depth--;
          }
        }
        if (endIdx !== -1) {
          const content = formatted.slice(closeBracketIdx + 2, endIdx);
          const placeholder = protectKaTeX(`\\sqrt[${rootIndex}]{${content}}`, false);
          formatted = formatted.slice(0, startIdx) + placeholder + formatted.slice(endIdx + 1);
          continue;
        }
      }
    }
    // \sqrt{...} tiêu chuẩn
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx + 6; i < formatted.length; i++) {
      if (formatted[i] === '{') depth++;
      else if (formatted[i] === '}') {
        if (depth === 0) { endIdx = i; break; }
        depth--;
      }
    }
    if (endIdx === -1) break;
    const content = formatted.slice(startIdx + 6, endIdx);
    const placeholder = protectKaTeX(`\\sqrt{${content}}`, false);
    formatted = formatted.slice(0, startIdx) + placeholder + formatted.slice(endIdx + 1);
  }

  // g. Đồng vị hạt nhân chưa bọc $: ^6_3Li hoặc ^{6}_{3}Li hoặc _3^6Li
  formatted = formatted.replace(/\^\{?([0-9]+)\}?_\{?([0-9]+)\}?([A-Z][a-z]?)/g, (match, top, bot, elem) => {
    return protectKaTeX(`{}^{${top}}_{${bot}}\\text{${elem}}`, false);
  });
  formatted = formatted.replace(/_\{?([0-9]+)\}?\^\{?([0-9]+)\}?([A-Z][a-z]?)/g, (match, bot, top, elem) => {
    return protectKaTeX(`{}^{${top}}_{${bot}}\\text{${elem}}`, false);
  });

  // h. Tự động chuyển các ký tự LaTeX thông thường trong phần văn bản còn lại
  latexTranslations.forEach(t => {
    formatted = formatted.replace(t.regex, t.replacement);
  });

  // i. Chuyển đổi ion hóa học (như Fe3+, SO4 2-, Cl-, Na+, Ca2+, NH4+, OH-)
  formatted = formatted.replace(/\b(Fe|Cu|Zn|Mg|Ca|Ba|Al|Ag|Na|K|NH4|H|Cl|OH|NO3|SO4|PO4|CO3|HCO3)\s?([1-9]?[+\-])\b/gi, (match, ion, charge) => {
    const chargeSup = charge.split('').map(c => superscriptMap[c] || c).join('');
    return `${ion}${chargeSup}`;
  });

  // j. Chuyển đổi công thức hóa học tự nhiên (H2O, CO2, H2SO4, CaCO3, Al2O3, Fe2O3, KMnO4, C6H12O6, CH3COOH, CuSO4, HNO3)
  formatted = formatted.replace(/\b(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Sc|Ti|V|Cr|Mn|Fe|Co|Ni|Cu|Zn|Ga|Ge|As|Se|Br|Kr|Rb|Sr|Y|Zr|Nb|Mo|Tc|Ru|Rh|Pd|Ag|Cd|In|Sn|Sb|Te|I|Xe|Ba|Au|Hg|Pb|Bi|U)([2-9]|[1-9][0-9])\b/g, (match, elem, num) => {
    const numSub = num.split('').map(c => subscriptMap[c] || c).join('');
    return `${elem}${numSub}`;
  });

  // k. Chuyển đổi chỉ số gạch dưới & lũy thừa còn lại (C_M, N_A, x_1, 10^23, x^2)
  formatted = formatted.replace(/([A-Za-z0-9\)])_([0-9a-zA-Z]{1,4})/g, (_, base, sub) => {
    const subConverted = sub.split('').map(char => subscriptMap[char] || char).join('');
    return `${base}${subConverted}`;
  });

  formatted = formatted.replace(/([A-Za-z0-9\)])\^([\+\-]?[0-9a-zA-Z]{1,4})/g, (_, base, sup) => {
    const supConverted = sup.split('').map(char => superscriptMap[char] || char).join('');
    return `${base}${supConverted}`;
  });

  // 4. Định dạng chỉ số dưới & chỉ số trên cho văn bản thường (như __{...} và ^{...})
  formatted = formatted.replace(/\\lim_\{([^}]+)\}/g, (match, limitContent) => protectKaTeX(`\\lim_{${limitContent}}`, false));
  formatted = formatted.replace(/lim_\{([^}]+)\}/g, (match, limitContent) => protectKaTeX(`\\lim_{${limitContent}}`, false));
  
  formatted = formatted.replace(/_\{([^}]+)\}/g, '<sub style="font-size:0.75em; vertical-align:-0.25em; white-space:nowrap; display:inline-block; line-height:1;">$1</sub>');
  formatted = formatted.replace(/\^\{([^}]+)\}/g, '<sup style="font-size:0.75em; vertical-align:0.35em; white-space:nowrap; display:inline-block; line-height:1;">$1</sup>');

  // 5. Khôi phục các khối KaTeX đã render
  katexPlaceholders.forEach((katexHtml, idx) => {
    formatted = formatted.split(`###KATEXPH${idx}KATEXPH###`).join(katexHtml);
  });

  // 6. Khôi phục các thẻ HTML đã bảo vệ
  htmlPlaceholders.forEach((htmlTag, idx) => {
    formatted = formatted.split(`###HTMLPH${idx}HTMLPH###`).join(htmlTag);
  });

  return formatted;
};

export const formatBioText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return formatMathText(text);
};

/**
 * Chuyển đổi mã lệnh LaTeX và ký hiệu toán học thô thành văn bản Tiếng Việt tự nhiên dễ đọc.
 * Ví dụ: \widehat{ABC} = 120^0 -> góc ABC = 120°
 *       SA \perp (ABCD) -> SA ⊥ (ABCD)
 *       BC = a\sqrt{2} -> BC = a√2
 */
export function toNaturalVietnameseMathText(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text;

  // 1. Gỡ bỏ ký hiệu bọc LaTeX inline $...$ hoặc $$...$$
  s = s.replace(/\$\$([^$]+)\$\$/g, '$1');
  s = s.replace(/\$([^$]+)\$/g, '$1');

  // 2. Ký hiệu góc: \widehat{ABC}, \widehat ABC, \angle ABC, \angle{ABC}
  s = s.replace(/(?:góc\s*)?\\widehat\{([A-Za-z0-9_']+)\}/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\widehat\s*([A-Za-z]{1,4})/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\{([A-Za-z0-9_']+)\}/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\s*([A-Za-z0-9_']+)/gi, 'góc $1');
  s = s.replace(/(?:góc\s*)?\\angle\s*(\([^)]+\))/gi, 'góc $1');

  // 3. Ký hiệu độ: 120^0, 120^\circ, 120^{\circ}, 120^o, 120^\circle
  s = s.replace(/(\d+)\s*\^\s*\{?\s*(?:0|o|\\circ)\s*\}?/gi, '$1°');
  s = s.replace(/(\d+)\s*\\circ\b/g, '$1°');

  // 4. Ký hiệu tam giác: \Delta ABC, \triangle ABC
  s = s.replace(/(?:tam giác\s*)?\\(?:Delta|triangle)\s*([A-Za-z]{3})/gi, 'tam giác $1');
  s = s.replace(/(?:tam giác\s*)?\\(?:Delta|triangle)\{([A-Za-z]{3})\}/gi, 'tam giác $1');

  // 5. Căn bậc hai: \sqrt{3} -> √3, \sqrt{a^2 + b^2} -> √(a² + b²)
  s = s.replace(/\\sqrt\{([0-9a-zA-Z]+)\}/g, '√$1');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  s = s.replace(/\\sqrt\s*(\d+)/g, '√$1');

  // 6. Phân số: \frac{a}{b} -> a/b
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2');

  // 7. Ký hiệu vuông góc, song song
  s = s.replace(/\\perp\b/g, ' ⊥ ');
  s = s.replace(/\\parallel\b/g, ' // ');

  // 8. Dấu nhân, chấm
  s = s.replace(/\\times\b/g, '×');
  s = s.replace(/\\cdot\b/g, '·');

  // 9. Dấu phẩy A^\prime -> A'
  s = s.replace(/([A-Za-z])\s*\^\s*\{?\\prime\}?/g, "$1'");

  // 10. Tránh lặp từ
  s = s.replace(/\bgóc\s+góc\b/gi, 'góc');
  s = s.replace(/\btam giác\s+tam giác\b/gi, 'tam giác');

  // 11. Dọn dẹp khoảng trắng thừa
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}
