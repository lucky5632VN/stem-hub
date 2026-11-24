const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

['toan', 'ly', 'hoa', 'sinh'].forEach(subj => {
  const items = data.filter(x => x.subject === subj);
  const withoutDollarQ = items.filter(x => !x.question.includes('$'));
  const withoutDollarGT = items.filter(x => !x.ground_truth.includes('$'));
  console.log(`[${subj}] Total: ${items.length}, Q without $: ${withoutDollarQ.length}, GT without $: ${withoutDollarGT.length}`);
});

