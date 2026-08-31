const evaluateShortAnswer = (q, userInput) => {
  const rawTarget = q?.correctShortAnswer ?? q?.correctAnswer ?? q?.correct ?? q?.answer ?? '';
  const targetVal = String(rawTarget).trim().toLowerCase();
  const userVal = String(userInput || '').trim().toLowerCase();
  if (!targetVal || !userVal) return false;
  
  const targetNum = parseFloat(targetVal);
  const userNum = parseFloat(userVal);
  if (!isNaN(targetNum) && !isNaN(userNum)) {
    return Math.abs(targetNum - userNum) <= 0.1;
  }
  return targetVal === userVal;
};

const calculateTfScore = (correctAnswers, userAnswers) => {
  let correctCount = 0;
  const total = Array.isArray(correctAnswers) && correctAnswers.length > 0 ? correctAnswers.length : 4;
  if (Array.isArray(correctAnswers) && Array.isArray(userAnswers)) {
    userAnswers.forEach((val, idx) => {
      if (val === correctAnswers[idx]) correctCount++;
    });
  }
  const partialScore = total > 0 ? correctCount / total : 0;
  return { partialScore, correctCount, total };
};

console.log("=== RUNNING ARENA LOGIC UNIT TESTS ===");

// 1. Short Answer Tests
const saTests = [
  { q: { correctShortAnswer: 54 }, input: "54", expected: true },
  { q: { correctShortAnswer: 54 }, input: "53.95", expected: true },
  { q: { correctShortAnswer: 54 }, input: "55", expected: false },
  { q: { correctAnswer: 0 }, input: "0", expected: true }, // Falsy 0 check!
  { q: { correct: 0 }, input: "0", expected: true },
  { q: { correctShortAnswer: 0 }, input: "1", expected: false },
  { q: { answer: "  H2SO4 " }, input: "h2so4", expected: true },
  { q: { correctAnswer: 3.14 }, input: "3.1415", expected: true },
];

let saPassed = 0;
saTests.forEach((t, i) => {
  const res = evaluateShortAnswer(t.q, t.input);
  const pass = res === t.expected;
  if (pass) saPassed++;
  console.log(`[SA Test ${i + 1}] ${pass ? 'PASS' : 'FAIL'}: target=${JSON.stringify(t.q)}, input=${t.input} => got ${res}, expected ${t.expected}`);
});

// 2. True/False Partial Scoring Tests
const tfTests = [
  { correct: [true, false, true, true], user: [true, false, true, true], expectedScore: 1.0, expectedCount: 4 },
  { correct: [true, false, true, true], user: [true, false, true, false], expectedScore: 0.75, expectedCount: 3 },
  { correct: [true, false, true, true], user: [true, false, false, false], expectedScore: 0.50, expectedCount: 2 },
  { correct: [true, false, true, true], user: [true, true, false, false], expectedScore: 0.25, expectedCount: 1 },
  { correct: [true, false, true, true], user: [false, true, false, false], expectedScore: 0.0, expectedCount: 0 },
];

let tfPassed = 0;
tfTests.forEach((t, i) => {
  const res = calculateTfScore(t.correct, t.user);
  const pass = res.partialScore === t.expectedScore && res.correctCount === t.expectedCount;
  if (pass) tfPassed++;
  console.log(`[TF Test ${i + 1}] ${pass ? 'PASS' : 'FAIL'}: ${res.correctCount}/${res.total} correct => score ${res.partialScore} (expected ${t.expectedScore})`);
});

console.log(`\nResults: SA ${saPassed}/${saTests.length} Passed, TF ${tfPassed}/${tfTests.length} Passed.`);
if (saPassed === saTests.length && tfPassed === tfTests.length) {
  console.log("SUCCESS: ALL ARENA LOGIC TESTS PASSED!");
} else {
  console.error("ERROR: SOME TESTS FAILED!");
  process.exit(1);
}
