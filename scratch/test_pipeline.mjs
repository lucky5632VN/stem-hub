import katex from 'katex';

function renderKaTeXSafe(latex, displayMode = false) {
  try {
    let cleanLatex = latex.trim();
    cleanLatex = cleanLatex.replace(/\\\\\s*\\n/g, '\\\\ ');
    
    const rendered = katex.renderToString(cleanLatex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'html'
    });
    if (displayMode) {
      return `<div class="katex-display-scroll">${rendered}</div>`;
    }
    return rendered;
  } catch {
    return `<span class="katex-fallback">${latex}</span>`;
  }
}

function cleanLatexMath(text) {
  if (!text) return '';

  let formatted = text;
  const renderedMap = new Map();
  let tokenCounter = 0;

  const createToken = (latex, displayMode) => {
    if (!latex || !latex.trim()) return '';
    const token = `__KATEX_TOKEN_${Date.now()}_${tokenCounter++}__`;
    const renderedHtml = renderKaTeXSafe(latex, displayMode);
    renderedMap.set(token, renderedHtml);
    return token;
  };

  // 1. Process Display Math: $$ ... $$ and \[ ... \] FIRST
  formatted = formatted.replace(/\$\$([\s\S]+?)\$\$/g, (_match, p1) => createToken(p1, true));
  formatted = formatted.replace(/\\\[([\s\S]+?)\\\]/g, (_match, p1) => createToken(p1, true));

  // 2. Standalone environments
  const envNames = ['cases', 'aligned', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'gather', 'equation'];
  envNames.forEach(env => {
    const regex = new RegExp(`\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\}`, 'g');
    formatted = formatted.replace(regex, (match) => createToken(match, true));
  });

  // 3. Process Inline Math: $ ... $ and \( ... \)
  formatted = formatted.replace(/\\\(([\s\S]+?)\\\)/g, (_match, p1) => createToken(p1, false));
  formatted = formatted.replace(/(?<!\$)\$([^$\n\r]+?)\$(?!\$)/g, (_match, p1) => createToken(p1, false));

  // 4. Translate raw LaTeX symbols outside math blocks
  const rawSymbolMap = [
    [/\\perp\b/g, '⊥'],
    [/\\parallel\b/g, '∥'],
    [/\\Rightarrow\b/g, '⇒'],
    [/\\Leftrightarrow\b/g, '⇔'],
    [/\\rightarrow\b|\\to\b/g, '→'],
    [/\\leftarrow\b/g, '←'],
    [/\\times\b/g, '×'],
    [/\\cdot\b/g, '·'],
    [/\\approx\b/g, '≈'],
    [/\\Delta\b/g, 'Δ'],
    [/\\pi\b/g, 'π'],
    [/\\alpha\b/g, 'α'],
    [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'],
    [/\\theta\b/g, 'θ'],
    [/\\le\b|\\leq\b/g, '≤'],
    [/\\ge\b|\\geq\b/g, '≥'],
    [/\\neq\b/g, '≠'],
    [/\\subset\b/g, '⊂'],
    [/\\supset\b/g, '⊃'],
    [/\\cap\b/g, '∩'],
    [/\\cup\b/g, '∪'],
    [/\\in\b/g, '∈'],
    [/\\notin\b/g, '∉'],
    [/\\widehat\{([^{}]+)\}/g, '∠$1'],
    [/\\angle\b/g, '∠'],
    [/\\triangle\b/g, '△'],
    [/\\sqrt\{([^{}]+)\}/g, '√($1)'],
    [/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)'],
    [/\\text\{\s*([^}]+?)\s*\}/g, '$1']
  ];

  rawSymbolMap.forEach(([pattern, replacement]) => {
    formatted = formatted.replace(pattern, replacement);
  });

  // 5. Restore KaTeX rendered HTML
  renderedMap.forEach((html, token) => {
    formatted = formatted.split(token).join(html);
  });

  return formatted;
}

// Case A: What if the string came from Gemini WITHOUT $...$ ?
const caseA = `A'G là:
A'G =
\\sqrt{AA'^2 - AG^2} =
\\sqrt{a^2 - \\frac{a^2}{3}} =
\\frac{a\\sqrt{6}}{3}
Vậy thể tích khối lăng trụ ABC.A'B'C' là:

V = S_{\\Delta ABC}
\\cdot A'G =
\\frac{a^2\\sqrt{3}}{4}
\\cdot
\\frac{a\\sqrt{6}}{3} =
\\frac{a^3\\sqrt{2}}{4}`;

console.log('--- Case A: No dollar signs around formulas ---');
console.log(cleanLatexMath(caseA));

// Case B: What if KaTeX rendered "frac a^2 sqrt 3 4" ?
console.log('\n--- KaTeX rendering of: "frac a^2 sqrt 3 4" ---');
console.log(katex.renderToString("frac a^2 sqrt 3 4", { throwOnError: false }));
