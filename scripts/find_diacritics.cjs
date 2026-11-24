const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

data.forEach(item => {
  ['question', 'ground_truth', 'gemini_response'].forEach(f => {
    const val = item[f] || '';
    const mathMatches = val.match(/\$([^$]+)\$/g);
    if (mathMatches) {
      mathMatches.forEach(m => {
        if (/[ặỏụ]/.test(m)) {
          console.log(`[${item.id}] ${f}: ${m}`);
        }
      });
    }
  });
});

