import { execSync } from 'child_process';
import path from 'path';

const cwd = path.resolve('cloudflare-worker');
try {
  const out = execSync('npx.cmd --yes wrangler secret list', { cwd, encoding: 'utf8' });
  console.log('Secrets list:\n', out);
} catch (e) {
  console.error('Error getting secrets:', e.message, e.stdout, e.stderr);
}
