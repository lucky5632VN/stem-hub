const fs = require('fs');

const fileSrc = 'src/data/global-learned-knowledge.json';
const filePub = 'public/data/global-learned-knowledge.json';

const data = JSON.parse(fs.readFileSync(fileSrc, 'utf8'));
console.log('Total items in src:', data.length);

const keywords = ['khang', 'nguyễn', 'nguyen', 'chào', 'bạn chính là', 'apprentice', 'elo', 'tinh thể', 'admin', 'phiên', 'lv.'];

const found = [];
data.forEach((item, index) => {
  const fullText = ((item.query || '') + ' ' + (item.answer || '') + ' ' + (item.content || '')).toLowerCase();
  const matched = keywords.filter(k => fullText.includes(k));
  if (matched.length > 0) {
    found.push({ index, query: item.query, answer: item.answer, matched });
  }
});

console.log('Found matched items:', found.length);
found.forEach((f) => {
  console.log('---');
  console.log(`Index: ${f.index}, Matched: ${f.matched.join(', ')}`);
  console.log(`Query: "${f.query}"`);
  console.log(`Answer: ${f.answer.slice(0, 160)}...`);
});
