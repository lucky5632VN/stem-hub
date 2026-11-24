import fs from 'fs';
const transcriptPath = 'C:/Users/dell/.gemini/antigravity/brain/5ef4e519-c21d-4c3d-8b53-767ebad67a84/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

lines.forEach((line, idx) => {
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' || data.source === 'USER_EXPLICIT') {
      const t = data.created_at || '';
      if (t >= '2026-11-23T03:00:00Z' && t <= '2026-11-23T08:00:00Z') {
        console.log(`\n==================================================`);
        console.log(`[${t}] Line ${idx}`);
        console.log(data.content);
      }
    }
  } catch(e) {}
});

