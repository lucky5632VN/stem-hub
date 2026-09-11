import fs from 'fs';
import vm from 'vm';

console.log('🧪 [Test Suite]: Validating Chat Messages & Bubbles Across All Labs...');

const bridgeCode = fs.readFileSync('public/labs/shared/stem-lab-ai-bridge.js', 'utf8');

const sandbox = {
  window: {},
  document: {
    getElementById: () => null,
    createElement: () => ({ setAttribute: () => {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: () => {}
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(bridgeCode, sandbox);

const bridge = sandbox.window.StemLabAIBridge;

if (!bridge) {
  console.error('❌ StemLabAIBridge failed to initialize!');
  process.exit(1);
}

console.log('✅ StemLabAIBridge loaded successfully.');

// Test 1: formatUserMessage must NEVER return empty string on valid user input
const userTestQueries = [
  'Chào thầy',
  'Chào bạn',
  'Xin chào',
  'chào',
  'Chào thầy cô',
  'Em chào thầy, cho em hỏi bài này',
  'Tính chu kỳ con lắc đơn l = 1m',
  'Cho hình lăng trụ đứng ABC.A\'B\'C\'',
  'v = 10 m/s',
  'Tính diện tích tam giác có đáy $a = 5$ và chiều cao $h = 4$',
  'Công thức $\\frac{a}{b}$ tính thế nào?',
  'Khối chóp $S.ABC$',
  'Dưới đây là bài toán của em',
  'Chúc bạn học tốt'
];

let failed = 0;

for (const q of userTestQueries) {
  const formatted = bridge.formatUserMessage(q);
  if (!formatted || formatted.trim() === '') {
    console.error(`❌ formatUserMessage returned empty for query: "${q}"`);
    failed++;
  } else {
    console.log(`✅ [User Message OK]: "${q}" -> "${formatted}"`);
  }
}

// Test 2: formatAIFormulaText must NEVER return empty string on short greeting/response
const aiTestResponses = [
  'Chào bạn! Rất vui được hỗ trợ bạn.',
  'Chào em! Thầy là AI Vật Lý.',
  'Xin chào!',
  'Thể tích khối chóp là $V = \\frac{1}{3}Bh = \\frac{a^3\\sqrt{3}}{12}$.',
  'Chu kỳ dao động $T = 2\\pi\\sqrt{\\frac{l}{g}}$.'
];

for (const resp of aiTestResponses) {
  const formatted = bridge.formatAIFormulaText(resp);
  if (!formatted || formatted.trim() === '') {
    console.error(`❌ formatAIFormulaText returned empty for AI response: "${resp}"`);
    failed++;
  } else {
    console.log(`✅ [AI Formula OK]: "${resp}" -> "${formatted.substring(0, 50)}..."`);
  }
}

if (failed === 0) {
  console.log('\n🎉 ALL 19 TEST CASES PASSED! Chat bubbles will NEVER collapse or be empty!');
} else {
  console.error(`\n❌ ${failed} tests failed!`);
  process.exit(1);
}
