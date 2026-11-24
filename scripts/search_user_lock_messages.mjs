import fs from 'fs';
const transcriptPath = 'C:/Users/dell/.gemini/antigravity/brain/5ef4e519-c21d-4c3d-8b53-767ebad67a84/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

let userInputs = [];
lines.forEach((line, idx) => {
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' || data.source === 'USER_EXPLICIT') {
      userInputs.push({
        idx,
        created_at: data.created_at,
        content: data.content
      });
    }
  } catch(e) {}
});

console.log('Total USER_INPUT found:', userInputs.length);
userInputs.forEach(u => {
  const c = u.content || '';
  if (c.includes('1.4') || c.includes('khóa') || c.includes('khoá') || c.includes('ngưỡng') || c.includes('chốt') || c.includes('tick') || c.includes('Mục')) {
    console.log(`\n--- [${u.created_at}] (line ${u.idx}) ---`);
    console.log(c.slice(0, 400));
  }
});
