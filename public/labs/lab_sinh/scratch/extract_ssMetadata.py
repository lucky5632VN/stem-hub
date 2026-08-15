path = r"e:\project\lab_sinh\New folder\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

keyword = "ssMetadata"
idx = content.find(keyword)
if idx != -1:
    start = content.find("[", idx)
    # Find matching bracket for ssMetadata
    bracket_count = 0
    end = -1
    for i in range(start, len(content)):
        if content[i] == "[":
            bracket_count += 1
        elif content[i] == "]":
            bracket_count -= 1
            if bracket_count == 0:
                end = i + 1
                break
    
    if end != -1:
        metadata_str = content[start:end]
        with open(r"e:\project\lab_sinh\scratch\ssMetadata.json", "w", encoding="utf-8") as out:
            out.write(metadata_str)
        print(f"Saved ssMetadata to scratch/ssMetadata.json")
    else:
        print("End of ssMetadata not found")
else:
    print("ssMetadata not found")
