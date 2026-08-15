path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

keyword = "manifest"
idx = content.find(keyword)
if idx != -1:
    print(f"Found '{keyword}' at index {idx}")
    # Use a slice and print safely
    sub = content[idx-100:idx+2000]
    print(sub.encode('ascii', errors='replace').decode('ascii'))
else:
    print(f"Keyword '{keyword}' not found")

keyword = "properties"
idx = content.find(keyword)
if idx != -1:
    print(f"Found '{keyword}' at index {idx}")
    sub = content[idx-100:idx+2000]
    print(sub.encode('ascii', errors='replace').decode('ascii'))
else:
    print(f"Keyword '{keyword}' not found")
