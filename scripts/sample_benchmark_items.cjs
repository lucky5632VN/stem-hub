const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

['toan', 'ly', 'hoa', 'sinh'].forEach(subj => {
  console.log(`\n=================== SUBJECT: ${subj.toUpperCase()} ===================`);
  const items = data.filter(x => x.subject === subj);
  items.slice(0, 5).forEach(x => {
    console.log(`[${x.id}]`);
    console.log(`  Q:  ${x.question}`);
    console.log(`  GT: ${x.ground_truth}`);
    console.log(`  AI: ${x.gemini_response}`);
  });
});

