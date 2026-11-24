const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

['toan', 'ly', 'hoa', 'sinh'].forEach(subj => {
  console.log('\n==============================');
  console.log('SUBJECT:', subj.toUpperCase());
  console.log('==============================');
  const items = data.filter(x => x.subject === subj);
  items.forEach(it => {
    console.log(`[${it.id}] [${it.topic}]`);
    console.log('  Q:', it.question);
    console.log('  GT:', it.ground_truth);
    console.log('  RESP:', it.gemini_response);
  });
});

