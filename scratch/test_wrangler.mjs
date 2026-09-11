import { spawn } from 'child_process';
import path from 'path';

const cwd = path.resolve('cloudflare-worker');
console.log('Spawning npx wrangler whoami in', cwd);

const child = spawn('npx.cmd', ['--yes', 'wrangler', 'whoami'], {
  cwd,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  console.log('[STDOUT]:', data.toString());
});

child.stderr.on('data', (data) => {
  console.log('[STDERR]:', data.toString());
});

child.on('close', (code) => {
  console.log('Exited with code:', code);
});
