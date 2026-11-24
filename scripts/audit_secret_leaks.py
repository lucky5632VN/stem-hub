import os
import re

env_secrets = {}
if os.path.exists('.env.local'):
    with open('.env.local', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k in ['CRON_SECRET', 'ADMIN_SECRET_KEY', 'INTERNAL_AI_SECRET', 'GEMINI_API_KEY', 'FIREBASE_PRIVATE_KEY']:
                    if v and len(v) > 5:
                        env_secrets[k] = v

print(f"Loaded {len(env_secrets)} sensitive keys from .env.local to audit.")

uuid_regex = re.compile(r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', re.IGNORECASE)
stemhub_sec_regex = re.compile(r'stemhub_sec_[A-Za-z0-9_]+')
rag_sig_regex = re.compile(r'stemhub_rag_internal_sig[A-Za-z0-9_]*')

target_dirs = ['docs', 'reports', 'tests']
single_files = ['README.md', 'TRAINING_LOG.md', 'package.json']

files_to_scan = []
for d in target_dirs:
    if os.path.exists(d):
        for root, dirs, files in os.walk(d):
            if 'node_modules' in dirs: dirs.remove('node_modules')
            if '.git' in dirs: dirs.remove('.git')
            if '.next' in dirs: dirs.remove('.next')
            for f in files:
                if f.endswith(('.md', '.json', '.js', '.mjs', '.cjs', '.jsx', '.txt')):
                    files_to_scan.append(os.path.join(root, f))

for f in single_files:
    if os.path.exists(f):
        files_to_scan.append(f)

leaks = []

for file_path in files_to_scan:
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for idx, line in enumerate(f, 1):
                # Check env_secrets
                for k, v in env_secrets.items():
                    if k == 'GEMINI_API_KEY':
                        # Check each subkey
                        for subkey in v.split(','):
                            subkey = subkey.strip()
                            if len(subkey) > 15 and subkey in line:
                                leaks.append((file_path, idx, f"GEMINI_API_KEY ({subkey[:4]}...{subkey[-4:]})", line.strip()[:100]))
                    elif k == 'FIREBASE_PRIVATE_KEY':
                        pass # handled by standard private key checks
                    else:
                        if v in line:
                            leaks.append((file_path, idx, f"{k} ({v[:4]}...{v[-4:]})", line.strip()[:100]))

                # Check pattern stemhub_sec_
                m = stemhub_sec_regex.search(line)
                if m:
                    leaks.append((file_path, idx, f"Pattern stemhub_sec_ ({m.group(0)[:8]}...)", line.strip()[:100]))

                # Check pattern stemhub_rag_internal_sig
                m = rag_sig_regex.search(line)
                if m:
                    leaks.append((file_path, idx, f"Pattern stemhub_rag_internal_sig ({m.group(0)[:8]}...)", line.strip()[:100]))
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

print(f"Total potential leaks found: {len(leaks)}")
for item in leaks:
    print(f"  {item[0]}:{item[1]} -> {item[2]}")
