import os

start_path = r"e:\project\lab_sinh\New folder"
for root, dirs, files in os.walk(start_path):
    for f in files:
        print(os.path.join(root, f))
