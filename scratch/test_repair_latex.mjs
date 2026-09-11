import katex from 'katex';

const formula = "A'G = \\sqrt{AA'^2 - AG^2} = \\sqrt{a^2 - \\frac{a^2}{3}} = \\frac{a\\sqrt{6}}{3}";
const rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
console.log('Raw KaTeX contains newline:', rendered.includes('\n'));
const cleaned = rendered.replace(/\r?\n/g, ' ');
console.log('Cleaned KaTeX contains newline:', cleaned.includes('\n'));
console.log('Path tag exists:', cleaned.includes('<path d='));
