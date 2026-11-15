import urllib.request
import os

os.makedirs('assets/nasa', exist_ok=True)

nasa_images = {
    'candle_comparison_grc.jpg': 'https://images-assets.nasa.gov/image/GRC-1998-C-00485/GRC-1998-C-00485~medium.jpg',
    'saffire_fabric_burn.jpg': 'https://images-assets.nasa.gov/image/jsc2023e046375/jsc2023e046375~medium.jpg',
    'saffire_pmma_burn.jpg': 'https://images-assets.nasa.gov/image/jsc2023e046631/jsc2023e046631~small.jpg',
    'bass_flame_iss.jpg': 'https://images-assets.nasa.gov/image/iss040e086481/iss040e086481~medium.jpg',
    'candle_microgravity_sts50.jpg': 'https://images-assets.nasa.gov/image/sts050-232-011/sts050-232-011~medium.jpg',
    'cir_hardware_iss.jpg': 'https://images-assets.nasa.gov/image/GRC-2005-C-00892/GRC-2005-C-00892~medium.jpg'
}

for name, url in nasa_images.items():
    dest = os.path.join('assets/nasa', name)
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"Already exists: {name}")
        continue
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            with open(dest, 'wb') as f:
                f.write(content)
            print(f"Downloaded {name} ({len(content)} bytes)")
    except Exception as e:
        print(f"Failed {name}: {e}")
