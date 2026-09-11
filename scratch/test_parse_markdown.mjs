import { parseMarkdown, cleanLatexMath } from '../public/labs/toan/frontend/src/utils/markdown.js';

const sample1 = `Thể tích khối lăng trụ xiên được tính bằng công thức $V = S_{đáy} \\times h$.

Với diện tích đáy $S_{ABC} = \\frac{a^2\\sqrt{3}}{4}$ và chiều cao $h = A'G = \\frac{a\\sqrt{6}}{3}$, ta có thể tích khối lăng trụ là:
$$V = \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{a\\sqrt{6}}{3} = \\frac{a^3\\sqrt{18}}{12} = \\frac{3a^3\\sqrt{2}}{12} = \\frac{a^3\\sqrt{2}}{4}$$`;

console.log('Result sample1:');
console.log(parseMarkdown(sample1));
