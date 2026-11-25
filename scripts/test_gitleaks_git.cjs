const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testGit = path.resolve('scratch/test_git_check');
if (fs.existsSync(testGit)) fs.rmSync(testGit, { recursive: true, force: true });
fs.mkdirSync(testGit, { recursive: true });

console.log('Copying staging to test git directory...');
execSync(`xcopy /E /I /Q "scratch\\staging_submission" "${testGit}"`, { stdio: 'inherit' });

console.log('Initializing git and committing...');
execSync(`git -C "${testGit}" init`, { stdio: 'inherit' });
execSync(`git -C "${testGit}" config user.name "Submission Verifier"`, { stdio: 'inherit' });
execSync(`git -C "${testGit}" config user.email "verifier@competition.local"`, { stdio: 'inherit' });
execSync(`git -C "${testGit}" add .`, { stdio: 'inherit' });
execSync(`git -C "${testGit}" commit -m "Initial clean submission package"`, { stdio: 'inherit' });

console.log('Running gitleaks git on test commit...');
try {
  const out = execSync(`gitleaks git "${testGit}" --redact`, { encoding: 'utf8' });
  console.log(out);
} catch (err) {
  console.log(err.stdout || err.stderr || err.message);
}

fs.rmSync(testGit, { recursive: true, force: true });
console.log('Cleaned up test git directory.');
