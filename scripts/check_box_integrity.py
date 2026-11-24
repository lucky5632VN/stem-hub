import re
import glob

def check_boxes():
    files = glob.glob('docs/*.md')
    for path in files:
        if 'phieu' in path or 'answer-key' in path:
            with open(path, 'r', encoding='utf-8') as f:
                c = f.read()
            x = len(re.findall(r'\[[xX]\]', c))
            empty = len(re.findall(r'\[\s*\]', c))
            print(f"{path}: checked [x]={x}, empty [ ]={empty}")

if __name__ == '__main__':
    check_boxes()

