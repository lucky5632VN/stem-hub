import os

path = r'e:\project\lab_sinh\New folder\muscle-contraction-sarcomere\muscle-contraction-sarcomere.js'
with open(path, 'rb') as f:
    f.seek(0, os.SEEK_END)
    size = f.tell()
    f.seek(max(0, size - 2000))
    print(f.read().decode('utf-8', errors='ignore'))
