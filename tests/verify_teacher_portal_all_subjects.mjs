import { formatMathText } from '../src/lib/mathFormatter.js';
import { sampleForReviewer } from '../src/lib/reviewSampler.js';

console.log('=== VERIFYING TEACHER REVIEW PORTAL SAMPLES ACROSS ALL 4 SUBJECTS ===');

['toan', 'ly', 'hoa', 'sinh'].forEach(subj => {
  console.log(`\n========================================`);
  console.log(`SUBJECT: ${subj.toUpperCase()}`);
  console.log(`========================================`);
  const res = sampleForReviewer({ subject: subj, seed: 2026, sampleSize: 5 });
  console.log(`Sampled ${res.samples.length} items for ${subj}:`);
  res.samples.forEach(s => {
    console.log(`\n[${s.sampleId}] (${s.topic})`);
    console.log('  Q_raw: ', s.question.substring(0, 70));
    const qHtml = formatMathText(s.question);
    console.log('  Q_katex:  ', qHtml.includes('class="katex'));
    
    console.log('  Resp_raw:', s.systemResponse.substring(0, 70));
    const rHtml = formatMathText(s.systemResponse);
    console.log('  Resp_katex:', rHtml.includes('class="katex'));
    
    console.log('  Ref_raw: ', s.referenceAnswer.substring(0, 70));
    const refHtml = formatMathText(s.referenceAnswer);
    console.log('  Ref_katex: ', refHtml.includes('class="katex'));
  });
});

