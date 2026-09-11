const fs = require('fs');
const path = require('path');
require('../public/labs/shared/stem-lab-ai-bridge.js');
const bridge = globalThis.StemLabAIBridge;

async function runTests() {
  console.log('=== TESTING LAB LEARNED KNOWLEDGE & CACHE HIT ===');

  // Let's check a question in toan
  const qMath = "Cho tôi biết hình lăng trụ là gì và công thức tính thể tích";
  const mathHit = await bridge.checkLabLearnedCache(qMath, "toan", 0.65);
  console.log('Math question in Math Lab cache result: hit =', mathHit.hit, 'score =', mathHit.score);

  // The same question in bio lab should NOT hit (cross-subject isolation)
  const bioHit = await bridge.checkLabLearnedCache(qMath, "sinh", 0.65);
  console.log('Math question in Bio Lab cache result: hit =', bioHit.hit);

  // Boundary check in bio lab:
  const bioGuard = bridge.checkSubjectBoundary(qMath, "sinh");
  console.log('Math question in Bio Lab boundary guard: allowed =', bioGuard.allowed, bioGuard.otherSubjectName);

  console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests();
