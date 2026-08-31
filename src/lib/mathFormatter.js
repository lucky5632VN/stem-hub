import katex from 'katex';

/**
 * Universal Math, Physics, Chemistry, Biology & LaTeX formatter for STEM HUB
 * Transforms LaTeX formulas (\dfrac, \frac, \sqrt, \begin{cases}, \pi, \alpha, \omega, isotopes, etc.)
 * into beautifully styled DOM elements using KaTeX with inline-block non-wrapping fallbacks.
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
  { regex: /\\rightarrow/g, replacement: ' → ' },
  { regex: /\\Rightarrow/g, replacement: ' ⇒ ' },
  { regex: /\\to/g, replacement: ' → ' },
  { regex: /\\Leftrightarrow/g, replacement: ' ⇔ ' },
  { regex: /\\times/g, replacement: ' × ' },
  { regex: /\\approx/g, replacement: ' ≈ ' },
  { regex: /\\cdot/g, replacement: ' · ' },
  { regex: /\\pm/g, replacement: '±' },
  { regex: /\\neq/g, replacement: '≠' },
  { regex: /\\infty/g, replacement: '∞' },
  { regex: /\\cup/g, replacement: ' ∪ ' },
  { regex: /\\le\b/g, replacement: '≤' },
  { regex: /\\ge\b/g, replacement: '≥' },
  { regex: /\\leq/g, replacement: '≤' },
  { regex: /\\geq/g, replacement: '≥' },
  { regex: /\\perp/g, replacement: '⊥' },
  { regex: /\\parallel/g, replacement: '∥' },
  { regex: /\\int/g, replacement: '∫' },
  { regex: /\\in\b/g, replacement: ' ∈ ' },
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

  // 2. Bảo vệ các thẻ HTML token đơn lẻ (<tag...>, </tag>, <img...>)
  // KHÔNG bọc toàn bộ khối <p>...</p> hay <div>...</div> để không làm ẩn văn bản chứa công thức bên trong!
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

  // b. Render Inline math \(...\)
  formatted = formatted.replace(/\\\(([\s\S]+?)\\\)/g, (match, p1) => protectKaTeX(p1, false));

  // c. Render Inline math $...$
  formatted = formatted.replace(/\$([^$]+?)\$/g, (match, p1) => protectKaTeX(p1, false));

  // d. Render Môi trường Hệ phương trình / Ma trận / Bảng LaTeX nhiều dòng
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

  // 4. Định dạng chỉ số dưới & chỉ số trên cho văn bản thường (như H2O, CO2, x^2)
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
