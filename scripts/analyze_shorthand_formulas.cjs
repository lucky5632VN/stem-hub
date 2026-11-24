const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

// Check for common shorthand patterns across all subjects:
// - sqrt(...)
// - int_...
// - fractions (a/b or a^3*sqrt(6)/6)
// - superscripts/subscripts like 1s^2, H2SO4, Fe3+, etc.
// - physics formulas like T = 2pi * sqrt(m/k), lambda = v / f
// - biology notations like A = T, G = X, 2n = 46, AaBb x AaBb
// - chemical equations like N2 + 3H2 <=> 2NH3

console.log('=== ANALYSIS OF SHORT-HAND / RAW FORMULAS IN BENCHMARK 150 ===\n');

data.forEach(item => {
  const fields = [item.question, item.ground_truth, item.gemini_response];
  const fullText = fields.join(' ');
  const hasSqrt = /sqrt/i.test(fullText);
  const hasInt = /\bint_|\bint\b/i.test(fullText);
  const hasAsterisk = /\*/.test(fullText);
  const hasCaret = /\^/.test(fullText);
  const hasSlashFraction = /[a-zA-Z0-9\)]+\/[a-zA-Z0-9\(]+/.test(fullText);
  const hasGreek = /\b(pi|omega|lambda|alpha|beta|gamma|delta|Delta)\b/i.test(fullText);
  const hasChemical = /([A-Z][a-z]?\d+|->|<=>|⇌)/.test(fullText);
  const hasUnits = /\b(m\/s|m\/s\^2|kg|m|s|mol|cm|mm|kJ|kcal|Hz|rad\/s|dB|V|A|W|Ω)\b/.test(fullText);
  
  if (hasSqrt || hasInt || hasAsterisk || (hasCaret && !fullText.includes('$')) || hasGreek) {
    console.log(`[${item.subject.toUpperCase()}] ${item.id}:`);
    console.log(`  Q: ${item.question}`);
    console.log(`  GT: ${item.ground_truth}`);
    console.log(`  RESP: ${item.gemini_response}`);
    console.log('---');
  }
});

