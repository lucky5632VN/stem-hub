const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/ai-training/datasets/rag_ablation_benchmark.json', 'utf8'));

if (d.hard_trap_gdpt2018) {
  console.log('Total hard_trap_gdpt2018:', d.hard_trap_gdpt2018.length);
  d.hard_trap_gdpt2018.forEach((x, i) => {
    console.log(`[${x.id || i}] (${x.subject})`);
    console.log(`  Q: ${x.question}`);
    console.log(`  A: ${x.correct_answer}`);
  });
}

