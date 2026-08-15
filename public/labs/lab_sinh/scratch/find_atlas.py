path = r'e:\project\lab_sinh\public\external\native\muscle-contraction\muscle-contraction-sarcomere.js'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()
    idx = content.find('312_atlas_')
    while idx != -1:
        print(f"Match at {idx}: {content[max(0, idx-100):idx+100]}")
        idx = content.find('312_atlas_', idx + 1)
