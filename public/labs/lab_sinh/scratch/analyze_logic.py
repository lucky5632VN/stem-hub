import re

path = r"e:\project\lab_sinh\public\external\native\respiratory-system\respiratory-system.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find instance of bouleZoom
# It looks like: this.instance_3 = new lib.bouleZoom();
instances = re.findall(r'this\.([a-zA-Z0-9_]+)\s*=\s*new\s+lib\.bouleZoom', content)
print("Instances found:", instances)

for inst in instances:
    # Find the click listener
    # this.instance_3.addEventListener("click", function(evt) { ... })
    # We use a non-greedy match for the function body
    pattern = r'this\.' + inst + r'\.addEventListener\("click",\s*function\(evt\)\s*\{([\s\S]*?)\}\.bind\(this\)\)'
    handlers = re.findall(pattern, content)
    
    if not handlers:
        # Try without .bind(this)
        pattern = r'this\.' + inst + r'\.addEventListener\("click",\s*function\(evt\)\s*\{([\s\S]*?)\}\)'
        handlers = re.findall(pattern, content)

    for h in handlers:
        print(f"--- Handler for {inst} ---")
        print(h.strip())

# Also search for where gotoAndStop is called with frame numbers
# Edumedia labs often jump frames to switch views
goto_calls = re.findall(r'this\.gotoAndStop\((\d+)\)', content)
print("GotoAndStop frames:", set(goto_calls))
