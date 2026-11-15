import urllib.request
import json
import os

os.makedirs('assets/planets', exist_ok=True)

targets = {
    'earth_disc.jpg': 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001465/GSFC_20171208_Archive_e001465~medium.jpg', # Blue Marble
    'moon_disc.jpg': 'https://images-assets.nasa.gov/image/PIA14445/PIA14445~small.jpg', # LRO Moon Global
    'mars_disc.jpg': 'https://images-assets.nasa.gov/image/PIA04304/PIA04304~small.jpg', # Mars Global MOC
    'iss_station.jpg': 'https://images-assets.nasa.gov/image/iss064e030060/iss064e030060~small.jpg', # ISS flyaround
    'orion_transit.jpg': 'https://images-assets.nasa.gov/image/art001e000670/art001e000670~small.jpg' # Artemis 1 Orion deep space
}

for name, url in targets.items():
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
