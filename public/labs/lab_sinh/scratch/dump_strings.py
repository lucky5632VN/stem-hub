path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import re
# Find all strings longer than 10 chars
strings = re.findall(r'\'[^\']{10,}\'|\"[^\"]{10,}\"', content)
for s in strings:
    if '.png' in s or '.jpg' in s or '.svg' in s or 'manifest' in s or 'properties' in s:
        print(s)
