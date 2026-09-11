import { spawn } from 'child_process';
import path from 'path';

const cwd = path.resolve('cloudflare-worker');
console.log('🚀 Running npx wrangler deploy in:', cwd);

const child = spawn('npx.cmd', ['--yes', 'wrangler', 'deploy'], {
  cwd,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  console.log(`\n✅ Deployment exited with code: ${code}`);
  process.exit(code);
});
