import urllib.request
import re

url = 'https://vnexpress.net/dap-an-chinh-thuc-tat-ca-mon-thi-tot-nghiep-thpt-2026-cua-bo-giao-duc-va-dao-tao-5086438.html'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    print('VnExpress Master Length:', len(html))
    # find images or links to Ly, Sinh, etc.
    links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL)
    for h, t in links:
        clean_t = re.sub(r'<[^>]+>', '', t).strip()
        if 'lý' in clean_t.lower() or 'sinh' in clean_t.lower() or 'hóa' in clean_t.lower() or 'pdf' in h or 'vat-ly' in h:
            print('  LINK:', h, '->', clean_t)
    imgs = re.findall(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)["\']', html)
    for i in imgs:
        if '2026' in i:
            print('  IMG:', i)
except Exception as e:
    print('Error:', e)

