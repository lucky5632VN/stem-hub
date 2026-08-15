import re

path = r"e:\project\lab_sinh\public\external\native\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Look for typical button names or labels
# Edumedia labs often have buttons in French or English
matches = re.findall(r'\"[^\"]*(?:btn|bouton|zoom|phong_to)[^\"]*\"', content, re.IGNORECASE)
print("Potential buttons/controls:", set(matches))
