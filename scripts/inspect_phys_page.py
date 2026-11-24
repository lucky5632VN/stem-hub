import urllib.request
import re

url = 'https://vietnamnet.vn/dap-an-chinh-thuc-mon-vat-ly-thi-tot-nghiep-thpt-nam-2026-cua-bo-gd-dt-2527498.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
print('Length:', len(html))

# find all images with data-original
imgs = re.findall(r'<img[^>]+data-original=["\']([^"\']+)["\']', html)
for i in imgs:
    print('IMG:', i)

# find all links
links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
for h, t in links:
    clean_t = re.sub(r'<[^>]+>', '', t).strip()
    if 'dap-an' in h or 'vat-ly' in h or 'pdf' in h or '252' in h:
        print('LINK:', h, '->', clean_t)

