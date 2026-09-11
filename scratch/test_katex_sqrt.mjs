import katex from 'katex';

const html = katex.renderToString("\\sqrt{3}", { displayMode: false });
console.log('HTML for \\sqrt{3}:');
console.log(html);

const htmlDisp = katex.renderToString("S = \\frac{a^2\\sqrt{3}}{4}", { displayMode: true });
console.log('\nHTML for display S:');
console.log(htmlDisp);
