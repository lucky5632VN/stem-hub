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
      output: 'html'
    });
  } catch (e) {
    return latex;
  }
};

// Map LaTeX symbols to Unicode
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
  { regex: /\\rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\Rightarrow/g, replacement: ' ➔ ' },
  { regex: /\\to/g, replacement: ' ➔ ' },
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
  { regex: /\\qquad/g, replacement: ' ' },
  { regex: /\\text/g, replacement: '' }
];

export const formatMathText = (text) => {
  if (!text || typeof text !== 'string') return '';

  let formatted = text;

  // 1. Dọn dẹp thẻ cũ
  formatted = formatted.replace(/#colorend/g, '');

  // 2. Bảo vệ các thẻ HTML có sẵn (như <img>, <sub>, <sup>, <span>, <p>, <br>, v.v.)
  const htmlPlaceholders = [];
  
  // Bảo vệ thẻ <img>
  formatted = formatted.replace(/<img\s+([^>]*?)src="([^"]+?)"([^>]*?)>/gi, (match, before, src, after) => {
    const idx = htmlPlaceholders.length;
    const cleanImg = `<img referrerpolicy="no-referrer" ${before}src="${encodeURI(src.trim())}"${after}>`;
    htmlPlaceholders.push(cleanImg);
    return `###HTMLPH${idx}HTMLPH###`;
  });

  // Bảo vệ tất cả các thẻ HTML khác (như <sub ...>...</sub>, <sup ...>...</sup>, v.v.)
  formatted = formatted.replace(/<([a-z1-6]+)(?:\s+[^>]*)?>([\s\S]*?)<\/\1>|<[a-z1-6]+(?:\s+[^>]*)?\/>/gi, (match) => {
    const idx = htmlPlaceholders.length;
    htmlPlaceholders.push(match);
    return `###HTMLPH${idx}HTMLPH###`;
  });

  // 3. Render các khối KaTeX: $$...$$, \[...\], $...$, \(...\)
  formatted = formatted.replace(/\$\$(.*?)\$\$/gs, (match, p1) => renderKaTeXSafe(p1.trim(), true));
  formatted = formatted.replace(/\\\[(.*?)\\\]/gs, (match, p1) => renderKaTeXSafe(p1.trim(), true));
  formatted = formatted.replace(/\$(.*?)\$/gs, (match, p1) => renderKaTeXSafe(p1.trim(), false));
  formatted = formatted.replace(/\\\((.*?)\\\)/gs, (match, p1) => renderKaTeXSafe(p1.trim(), false));

  // Render Hệ phương trình & môi trường LaTeX nhiều dòng
  while (formatted.includes('\\begin{cases}')) {
    const startIdx = formatted.indexOf('\\begin{cases}');
    const endIdx = formatted.indexOf('\\end{cases}', startIdx);
    if (endIdx === -1) break;
    const block = formatted.slice(startIdx, endIdx + 11);
    const cleanBlock = block.replace(/\r?\n/g, ' \\\\ ');
    const html = renderKaTeXSafe(cleanBlock, true);
    formatted = formatted.slice(0, startIdx) + html + formatted.slice(endIdx + 11);
  }

  while (formatted.includes('\\begin{aligned}')) {
    const startIdx = formatted.indexOf('\\begin{aligned}');
    const endIdx = formatted.indexOf('\\end{aligned}', startIdx);
    if (endIdx === -1) break;
    const block = formatted.slice(startIdx, endIdx + 13);
    const cleanBlock = block.replace(/\r?\n/g, ' \\\\ ');
    const html = renderKaTeXSafe(cleanBlock, true);
    formatted = formatted.slice(0, startIdx) + html + formatted.slice(endIdx + 13);
  }

  // Render phân số chưa bọc \frac{...}{...} và \dfrac{...}{...}
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
    const fracHtml = renderKaTeXSafe(fracLatex, false);
    formatted = formatted.slice(0, startIdx) + fracHtml + formatted.slice(endIdx + 1);
  }

  // Render căn thức chưa bọc \sqrt{...}
  while (formatted.includes('\\sqrt{')) {
    const startIdx = formatted.indexOf('\\sqrt{');
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
    const sqrtHtml = renderKaTeXSafe(`\\sqrt{${content}}`, false);
    formatted = formatted.slice(0, startIdx) + sqrtHtml + formatted.slice(endIdx + 1);
  }

  // Xử lý đồng vị hạt nhân: ^6_3Li hoặc ^{6}_{3}Li hoặc _3^6Li
  formatted = formatted.replace(/\^\{?([0-9]+)\}?_\{?([0-9]+)\}?([A-Z][a-z]?)/g, (match, top, bot, elem) => {
    return renderKaTeXSafe(`{}^{${top}}_{${bot}}\\text{${elem}}`, false);
  });
  formatted = formatted.replace(/_\{?([0-9]+)\}?\^\{?([0-9]+)\}?([A-Z][a-z]?)/g, (match, bot, top, elem) => {
    return renderKaTeXSafe(`{}^{${top}}_{${bot}}\\text{${elem}}`, false);
  });

  // 4. Bảo vệ các khối KaTeX đã được render thành công trước khi xử lý chỉ số dưới/chỉ số trên văn bản thường
  const katexPlaceholders = [];
  formatted = formatted.replace(/<span class="katex(?:-display)?">[\s\S]*?<\/span>/gi, (match) => {
    const idx = katexPlaceholders.length;
    katexPlaceholders.push(match);
    return `###KATEXPH${idx}KATEXPH###`;
  });

  // 5. Thay thế ký tự LaTeX thông thường trong phần văn bản còn lại
  latexTranslations.forEach(t => {
    formatted = formatted.replace(t.regex, t.replacement);
  });

  // 6. Định dạng chỉ số dưới & chỉ số trên cho văn bản thường (Công thức hóa học, Sinh học, v.v.)
  formatted = formatted.replace(/\\lim_\{([^}]+)\}/g, (match, limitContent) => renderKaTeXSafe(`\\lim_{${limitContent}}`, false));
  formatted = formatted.replace(/lim_\{([^}]+)\}/g, (match, limitContent) => renderKaTeXSafe(`\\lim_{${limitContent}}`, false));
  
  formatted = formatted.replace(/_\{([^}]+)\}/g, '<sub style="font-size:0.75em; vertical-align:-0.25em; white-space:nowrap; display:inline-block; line-height:1;">$1</sub>');
  formatted = formatted.replace(/_([0-9a-zA-Z]+)/g, '<sub style="font-size:0.75em; vertical-align:-0.25em; white-space:nowrap; display:inline-block; line-height:1;">$1</sub>');
  
  formatted = formatted.replace(/\^\{([^}]+)\}/g, '<sup style="font-size:0.75em; vertical-align:0.35em; white-space:nowrap; display:inline-block; line-height:1;">$1</sup>');
  formatted = formatted.replace(/\^([0-9a-zA-Z+\-]+)/g, '<sup style="font-size:0.75em; vertical-align:0.35em; white-space:nowrap; display:inline-block; line-height:1;">$1</sup>');

  // Dọn dẹp tiền tố vectơ bị lặp
  formatted = formatted.replace(/(vectơ\s+)+/gi, 'vectơ ');

  // 7. Khôi phục các khối KaTeX đã bảo vệ
  katexPlaceholders.forEach((katexHtml, idx) => {
    formatted = formatted.split(`###KATEXPH${idx}KATEXPH###`).join(katexHtml);
  });

  // 8. Khôi phục các thẻ HTML đã bảo vệ
  htmlPlaceholders.forEach((htmlTag, idx) => {
    formatted = formatted.split(`###HTMLPH${idx}HTMLPH###`).join(htmlTag);
  });

  return formatted;
};

export const formatBioText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return formatMathText(text);
};
