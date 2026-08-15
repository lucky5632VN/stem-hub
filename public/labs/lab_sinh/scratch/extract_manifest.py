import re
import json

path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Look for manifest:[...]
match = re.search(r"manifest:\s*(\[.*?\])", content)
if match:
    print(match.group(1))
else:
    print("Manifest not found")
