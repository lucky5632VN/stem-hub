import katex from 'katex';

const latex1 = "A'G = \\sqrt{AA'^2 - AG^2} = \\sqrt{a^2 - \\frac{a^2}{3}} = \\frac{a\\sqrt{6}}{3}";
const html1 = katex.renderToString(latex1, { throwOnError: false, strict: 'ignore' });
console.log('--- HTML1 length:', html1.length);

const latex2 = "frac a^2 sqrt 3 4";
const html2 = katex.renderToString(latex2, { throwOnError: false, strict: 'ignore' });
console.log('--- HTML2:', html2);
