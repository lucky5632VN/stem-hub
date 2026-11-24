import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://moet.gov.vn', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=10, context=ctx).read().decode('utf-8', errors='ignore')
print("Title:", re.findall(r'<title>(.*?)</title>', html, re.I))
# Search for exam articles
links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
print(f"Total links: {len(links)}")
found = False
for h, t in links:
    clean_t = re.sub(r'<[^>]+>', '', t).strip()
    if 'tốt nghiệp' in clean_t.lower() or 'đáp án' in clean_t.lower() or '2026' in clean_t or 'đề thi' in clean_t.lower():
        print(f"  Link: {h} -> {clean_t}")
        found = True
if not found:
    print("No exam links on home page.")

