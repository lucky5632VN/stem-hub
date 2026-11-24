import { formatMathText } from '../src/lib/mathFormatter.js';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/ai-training/datasets/benchmark_150_cases.json', 'utf8'));

data.forEach(item => {
  try {
    const q = formatMathText(item.question);
    const gt = formatMathText(item.ground_truth);
    const resp = formatMathText(item.gemini_response);
  } catch (e) {
    console.error(`Error in ${item.id}:`, e.message);
  }
});
console.log('Done scanning all 150 items!');

