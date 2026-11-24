import os
import shutil
import json

archive_dir = "reports/ablation/cache_archive/2026-11-23"
os.makedirs(archive_dir, exist_ok=True)

src_cache = "reports/ablation/call_cache.json"
dest_cache = os.path.join(archive_dir, "call_cache.json")

if os.path.exists(src_cache):
    shutil.copy2(src_cache, dest_cache)
    print(f"Archived {src_cache} to {dest_cache}")
    
    # Reset active call_cache.json to empty {}
    with open(src_cache, "w", encoding="utf-8") as f:
        json.dump({}, f, indent=2)
    print("Reset active reports/ablation/call_cache.json to empty {}")

pilot_cache_dir = "reports/ablation/pilot/cache"
os.makedirs(pilot_cache_dir, exist_ok=True)
pilot_cache_file = os.path.join(pilot_cache_dir, "call_cache.json")
if not os.path.exists(pilot_cache_file):
    with open(pilot_cache_file, "w", encoding="utf-8") as f:
        json.dump({}, f, indent=2)
    print(f"Initialized pilot cache at {pilot_cache_file}")

