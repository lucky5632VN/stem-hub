import re

path = r"e:\project\lab_sinh\public\external\native\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

arr_match = re.search(r'var a144_0x5dfc=\[(.*?)\];', content)
raw_arr = arr_match.group(1)
strings = []
for m in re.finditer(r"'((?:[^'\\]|\\.)*)'", raw_arr):
    strings.append(m.group(1))

apply_idx = strings.index('apply')
offset = 0xee # Based on previous calibration

def get_str(hex_val):
    try:
        idx = int(hex_val, 16)
        return strings[idx + offset]
    except:
        return f"UNKNOWN_{hex_val}"

click_idx = strings.index('click')
click_hex = hex(click_idx - offset)
print(f"'click' hex call: {click_hex}")

on_idx = strings.index('on')
on_hex = hex(on_idx - offset)
print(f"'on' hex call: {on_hex}")

# Search for .on("click") using hex calls
pattern = rf"\.{on_hex}\('{click_hex}'"
# Wait, it might be this[a144_0x2b5b('on_hex')]('click_hex')
pattern = rf"\[a144_0x2b5b\('{on_hex.replace('0x','')}'\)\]\(a144_0x2b5b\('{click_hex.replace('0x','')}'\)"

for m in re.finditer(r"addEventListener", content):
    print(f"Found addEventListener at {m.start()}")

# Find where bouleZoom (0x10a) is used
for m in re.finditer(r"0x10a", content):
    start = max(0, m.start() - 100)
    end = min(len(content), m.end() + 1000)
    chunk = content[start:end]
    
    def replacer(match):
        h = match.group(1)
        return f"'{get_str(h)}'"
    
    decoded_chunk = re.sub(r"a144_0x2b5b\('(\w+)'\)", replacer, chunk)
    print(f"Context for bouleZoom at {m.start()}:\n{decoded_chunk}\n---")
