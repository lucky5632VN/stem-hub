const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

console.log('Total items in benchmark_150_cases.json:', data.length);

const subjects = {};
data.forEach(item => {
  const s = item.subject;
  subjects[s] = subjects[s] || [];
  subjects[s].push(item);
});

for (const [s, items] of Object.entries(subjects)) {
  console.log(`\n=== ${s.toUpperCase()} (${items.length} items) ===`);
  items.forEach(item => {
    const hasMath = /[0-9=+\-*\/^_()\\<>]/.test(item.question) || /[0-9=+\-*\/^_()\\<>]/.test(item.ground_truth);
    const hasLatex = item.question.includes('$') || item.ground_truth.includes('$');
    if (hasMath && !hasLatex) {
      console.log(`[${item.id}]`);
      console.log(`  Q:  ${item.question}`);
      console.log(`  GT: ${item.ground_truth}`);
    }
  });
}

