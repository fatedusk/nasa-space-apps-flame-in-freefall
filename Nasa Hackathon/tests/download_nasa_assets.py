import urllib.request
import os

os.makedirs('assets/nasa', exist_ok=True)
url = 'https://science.nasa.gov/wp-content/uploads/2023/09/candle-flames.gif'
out_path = 'assets/nasa/candle-flames.gif'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        with open(out_path, 'wb') as f:
            f.write(data)
        print(f"Downloaded candle-flames.gif ({len(data)} bytes)")
except Exception as e:
    print("Download error:", e)
