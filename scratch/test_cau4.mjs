import { extractFallbackGeometry, solveGeometryFacts } from '../src/lib/geometryFactSolver.js';

const problemText = "Câu 4. Cho hình lăng trụ đứng ABC.A'B'C' có đáy ABC là tam giác vuông tại B, BC = a, mặt phẳng (A'BC) tạo với đáy một góc 30 độ và tam giác A'BC có diện tích bằng a^2\\sqrt{3}. Tính thể tích khối lăng trụ ABC.A'B'C'.";

console.log('--- TEST FALLBACK EXTRACTOR ---');
const fallbackData = extractFallbackGeometry(problemText);
console.log('Fallback extracted:', JSON.stringify(fallbackData, null, 2));

const fallbackSolved = solveGeometryFacts(fallbackData);
console.log('Fallback solved:', JSON.stringify(fallbackSolved, null, 2));
