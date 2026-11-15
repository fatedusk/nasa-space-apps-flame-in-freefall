import urllib.request
import os

images = {
    'earth_disc.jpg': 'https://images-assets.nasa.gov/image/PIA18033/PIA18033~medium.jpg',
    'iss_station.jpg': 'https://images-assets.nasa.gov/image/sts098-713a-016/sts098-713a-016~medium.jpg'
}

for name, url in images.items():
    dest = os.path.join('assets/planets', name)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            with open(dest, 'wb') as f:
                f.write(content)
            print(f"Downloaded {name} ({len(content)} bytes)")
    except Exception as e:
        print(f"Failed {name}: {e}")
