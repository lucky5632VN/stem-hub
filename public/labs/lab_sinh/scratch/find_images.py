import re

path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find anything that looks like a path or image
matches = re.findall(r'[\w\-/]+\.(?:png|jpg|jpeg|svg|json)', content)
print(matches)

# Also look for the manifest array
manifest_match = re.search(r'manifest\s*:\s*(\[.*?\])', content)
if manifest_match:
    print("Found manifest:", manifest_match.group(1))
else:
    print("Manifest not found via regex")
