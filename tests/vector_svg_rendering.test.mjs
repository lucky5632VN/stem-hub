import assert from 'node:assert';
import { formatMathText, toNaturalVietnameseMathText } from '../src/lib/mathFormatter.js';

console.log('--- Testing KaTeX SVG & Math newline handling ---');

// Case 1: Vector notation inside $...$
const vecText = 'Phương trình mặt phẳng tổng quát có dạng $Ax + By + Cz + D = 0$, với vectơ pháp tuyến là $\\vec{n} = (A; B; C)$.';
const formattedVec = formatMathText(vecText);
assert.strictEqual(formattedVec.includes('\n'), false, 'Vector text should not contain internal newlines');
assert.strictEqual(formattedVec.includes('<svg'), true, 'Vector should have rendered SVG');
assert.strictEqual(formattedVec.includes('c-16-25.333'), true, 'Vector path should be intact inside the line');
console.log('✅ Case 1 Passed: Inline vector math has no newlines and intact SVG.');

// Case 2: Raw vector without $
const rawVecText = 'vectơ chỉ phương \\vec{u} = (1; 2; 3)';
const formattedRawVec = formatMathText(rawVecText);
assert.strictEqual(formattedRawVec.includes('\n'), false, 'Raw vector should not have newlines');
assert.strictEqual(formattedRawVec.includes('<svg'), true, 'Raw vector should render KaTeX SVG');
console.log('✅ Case 2 Passed: Raw vector without $ renders cleanly.');

// Case 3: Multiline cases system
const casesText = `Hệ phương trình:
\\begin{cases}
x + y = 1 \\\\
2x - y = 3
\\end{cases}
Giải ra nghiệm.`;
const formattedCases = formatMathText(casesText);
const lines = formattedCases.split('\n');
console.log(`Cases lines: ${lines.length}`);
assert.strictEqual(lines.length, 3, 'Should preserve the 3 text lines without splitting the KaTeX block');
console.log('✅ Case 3 Passed: Multiline cases environment preserved.');

// Case 4: Natural Vietnamese math text
const natural = toNaturalVietnameseMathText('Cho $\\vec{n} = (1; 2; 3)$ và $\\overrightarrow{AB}$');
assert.strictEqual(natural.includes('vectơ n'), true, 'Should convert \\vec{n} to vectơ n');
assert.strictEqual(natural.includes('vectơ AB'), true, 'Should convert \\overrightarrow{AB} to vectơ AB');
console.log('✅ Case 4 Passed: Natural Vietnamese vector conversion works.');

console.log('🎉 ALL MATH FORMATTING TESTS PASSED!');

