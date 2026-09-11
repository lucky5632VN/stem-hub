require('../public/labs/shared/stem-lab-ai-bridge.js');
const bridge = globalThis.StemLabAIBridge;

// Test 1: Math question asked in Biology Lab
const test1 = bridge.checkSubjectBoundary("Cho tôi biết hình lăng trụ là gì và công thức tính thể tích", "sinh");
console.log('Test 1 (Math in Bio Lab):', test1);

// Test 2: Bio question asked in Biology Lab
const test2 = bridge.checkSubjectBoundary("Tại sao lá cây có màu xanh và quang hợp diễn ra ở đâu?", "sinh");
console.log('Test 2 (Bio in Bio Lab):', test2);

// Test 3: Physics question asked in Chem Lab
const test3 = bridge.checkSubjectBoundary("Công thức tính chu kỳ con lắc đơn là gì?", "hoa");
console.log('Test 3 (Physics in Chem Lab):', test3);

// Test 4: Chem question asked in Math Lab
const test4 = bridge.checkSubjectBoundary("Phương trình phản ứng xà phòng hóa chất béo là gì?", "toan");
console.log('Test 4 (Chem in Math Lab):', test4);
