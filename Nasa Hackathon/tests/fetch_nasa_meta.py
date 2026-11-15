import urllib.request
import re
import json

url = 'https://science.nasa.gov/image-detail/candle-flames-3/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        og_img = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
        desc = re.search(r'name=["\']description["\']\s+content=["\']([^"\']+)["\']', html)
        h1 = re.search(r'<h1[^>]*>([^<]+)</h1>', html)
        print("H1:", h1.group(1).strip() if h1 else None)
        print("OG Image:", og_img.group(1) if og_img else None)
        print("Desc:", desc.group(1) if desc else None)
        # Search for image tags with candle
        imgs = re.findall(r'src=["\']([^"\']*(?:candle|flame|acme)[^"\']*)["\']', html, re.I)
        print("Related images:", imgs[:5])
except Exception as e:
    print("Error:", e)
