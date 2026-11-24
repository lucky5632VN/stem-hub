import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    'https://moet.gov.vn',
    'https://moet.gov.vn/tintuc/Pages/tin-tong-hop.aspx',
    'https://moet.gov.vn/giaoducquocdan/khao-thi-va-kiem-dinh-chat-luong-giao-duc'
]

print("=== CHECKING MOET.GOV.VN CONNECTIVITY ===")
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
            print(f"URL: {u} -> HTTP {res.status}, Length: {len(res.read())}")
    except Exception as e:
        print(f"URL: {u} -> ERROR: {e}")

