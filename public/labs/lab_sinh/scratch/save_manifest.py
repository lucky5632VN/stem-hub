path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

keyword = "manifest"
idx = content.find(keyword)
if idx != -1:
    # Find the [ and matching ]
    start = content.find("[", idx)
    # Simple matching (might fail if nested, but manifest is usually flat)
    end = content.find("]", start) + 1
    manifest_str = content[start:end]
    
    with open(r"e:\project\lab_sinh\scratch\manifest.json", "w", encoding="utf-8") as out:
        out.write(manifest_str)
    print(f"Saved manifest to scratch/manifest.json")
else:
    print("Manifest not found")
