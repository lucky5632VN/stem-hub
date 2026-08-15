path = r"e:\project\lab_sinh\public\external\native\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find("Zoom")
if idx != -1:
    print(content[idx-100:idx+100])
else:
    print("Not found")
