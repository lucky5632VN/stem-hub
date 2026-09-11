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
      return `<div class="katex-display-scroll" style="overflow-x:auto;overflow-y:hidden;max-width:100%;margin:0.35rem 0;padding:2px 0;text-align:left;">${rendered}</div>`;
    }
    return rendered;
  } catch {
    return `<span class="katex-fallback" style="font-family:serif;font-style:italic;">${latex}</span>`;
  }
}

// Current cleanLatexMath in markdown.ts
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

const geminiAnswer = `Chào em, để tính thể tích khối lăng trụ tam giác $ABC.A'B'C'$, ta thực hiện theo các bước chuẩn mực sau:

1. **Tính diện tích đáy $S_{\\Delta ABC}$:**
   - Tứ giác $ABCD$ là hình thoi cạnh $a$ với $\\widehat{ABC} = 120^\\circ$. Do đó tam giác $ABC$ là tam giác cân tại $B$ có $\\widehat{ABC} = 120^\\circ$, nên tam giác $ABC$ có cạnh $AB = BC = a$ và góc xen giữa bằng $120^\\circ$.
   - Diện tích tam giác $ABC$ được tính bằng công thức:
     $$S_{\\Delta ABC} = \\frac{1}{2} \\cdot AB \\cdot BC \\cdot \\sin(\\widehat{ABC}) = \\frac{1}{2} \\cdot a \\cdot a \\cdot \\sin(120^\\circ) = \\frac{a^2\\sqrt{3}}{4}$$

2. **Tính chiều cao của khối lăng trụ $A'G$:**
   - Theo giả thiết, hình chiếu của đỉnh $A'$ lên mặt phẳng đáy $(ABCD)$ là trọng tâm $G$ của tam giác $ABD$. Do đó $A'G \\perp (ABCD)$ và $A'G$ chính là chiều cao của khối lăng trụ.
   - Xét tam giác $ABD$ đều cạnh $a$ (vì là hình thoi có góc $120^\\circ$), khoảng cách từ đỉnh $A$ đến trọng tâm $G$ là bán kính đường tròn ngoại tiếp nhân $\\sqrt{3}$ hoặc tính theo đường cao tam giác:
     $$AG = \\frac{2}{3} \\cdot \\frac{a\\sqrt{3}}{2} = \\frac{a\\sqrt{3}}{3}$$
   - Áp dụng định lý Pythagoras trong tam giác vuông $A'GA$ vuông tại $G$:\n     $$A'G = \\sqrt{AA'^2 - AG^2} = \\sqrt{a^2 - \\left(\\frac{a\\sqrt{3}}{3}\\right)^2} = \\frac{a\\sqrt{6}}{3}$$

3. **Tính thể tích khối lăng trụ $ABC.A'B'C'$:**
   - Áp dụng công thức tính thể tích khối lăng trụ $V = S_{\\text{đáy}} \\cdot h$:
     $$V_{ABC.A'B'C'} = S_{\\Delta ABC} \\cdot A'G = \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{a\\sqrt{6}}{3} = \\frac{a^3\\sqrt{2}}{4}$$`;

const res = cleanLatexMath(geminiAnswer);
console.log('Result contains katex-html:', res.includes('class="katex"'));
console.log('Result length:', res.length);
