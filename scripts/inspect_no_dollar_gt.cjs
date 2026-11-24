const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

['ly', 'hoa', 'sinh'].forEach(subj => {
  const items = data.filter(x => x.subject === subj && !x.ground_truth.includes('$'));
  console.log(`\n=== ${subj.toUpperCase()} without $ in GT (${items.length}) ===`);
  items.forEach(x => console.log(`[${x.id}] Q: ${x.question}\n   GT: ${x.ground_truth}\n`));
});

