import { spawn } from 'child_process';
import path from 'path';

const cwd = path.resolve('cloudflare-worker');
console.log('📡 Starting wrangler tail in:', cwd);

const child = spawn('npx.cmd', ['--yes', 'wrangler', 'tail'], {
  cwd,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  console.log('[TAIL-OUT]:\n' + data.toString());
});

child.stderr.on('data', (data) => {
  console.log('[TAIL-ERR]:\n' + data.toString());
});

child.on('close', (code) => {
  console.log('Tail process closed with code:', code);
});
