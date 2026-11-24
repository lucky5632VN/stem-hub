import urllib.request
import re

url = 'https://vnexpress.net/48-ma-de-vat-ly-thi-tot-nghiep-thpt-2026-kem-dap-an-chi-tiet-nhat-5084044-p5.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    print('VnExpress Phys Length:', len(html))
    imgs = re.findall(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']', html)
    for i in imgs:
        if '2026' in i or 'vat-ly' in i or 'dap-an' in i or 'thi' in i:
            print('  IMG:', i)
    links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
    for h, t in links:
        clean_t = re.sub(r'<[^>]+>', '', t).strip()
        if '0214' in clean_t or 'đáp án' in clean_t.lower() or 'vat-ly' in h:
            print('  LINK:', h, '->', clean_t)
except Exception as e:
    print('Error:', e)

