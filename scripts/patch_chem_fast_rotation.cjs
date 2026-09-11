const fs = require('fs');
const path = require('path');

const files = [
  'public/labs/lab-ktra15p/gemini_ai.js',
  'public/labs/lab-ktra15p/public/gemini_ai.js',
  'public/labs/lab-ktra15p/dist/gemini_ai.js',
  'public/labs/lab-ktra15p/dist/assets/index-DbqG5P_q.js'
];

files.forEach(rel => {
  const p = path.resolve(rel);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf-8');
    c = c.replace('Math.floor(tryCount / keyPool.length) % modelsToTry.length', 'tryCount % modelsToTry.length');
    c = c.replace('Math.floor(tryCount/keyPool.length)%modelsToTry.length', 'tryCount%modelsToTry.length');
    fs.writeFileSync(p, c, 'utf-8');
    console.log('✅ Patched fast model rotation in:', rel);
  }
});
