path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import re
# Look for {src:"...", id:"..."}
matches = re.findall(r'\{src:[^\}]+\}', content)
for m in matches:
    print(m)

# Look for ssMetadata
idx = content.find("ssMetadata")
if idx != -1:
    sub = content[idx:idx+2000]
    print(f"ssMetadata around: {sub.encode('ascii', errors='replace').decode('ascii')}")
