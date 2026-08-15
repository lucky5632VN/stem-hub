import re

path = r'e:\project\lab_sinh\public\external\native\muscle-contraction\muscle-contraction-sarcomere.js'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    
    # Search for patterns like {"images":["..."], "frames":[...]}
    # or even obfuscated versions.
    # Since it's obfuscated, let's look for large arrays of numbers.
    
    matches = re.findall(r'\{"images":\[.*?\],"frames":\[.*?\]\}', content)
    for m in matches:
        print(f"Found potential atlas: {m[:200]}...")

    # Also check for ssMetadata
    if "ssMetadata" in content:
        print("Found ssMetadata string")
