import re
path = r'e:\project\lab_sinh\public\external\native\muscle-contraction\muscle-contraction-sarcomere.js'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    # Find all lib.something = 
    matches = re.findall(r'lib\.([\w]+)\s*=', content)
    print(matches)
