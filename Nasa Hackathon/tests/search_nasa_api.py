import urllib.request
import json

def search_nasa_images(query):
    url = f"https://images-api.nasa.gov/search?q={urllib.parse.quote(query)}&media_type=image"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('collection', {}).get('items', [])
            print(f"=== Query: '{query}' Found: {len(items)} ===")
            for item in items[:4]:
                title = item.get('data', [{}])[0].get('title', '')
                nasa_id = item.get('data', [{}])[0].get('nasa_id', '')
                desc = item.get('data', [{}])[0].get('description', '')[:120]
                href = item.get('links', [{}])[0].get('href', '')
                print(f"- [{nasa_id}] {title}\n  Thumb: {href}\n  Desc: {desc}...\n")
    except Exception as e:
        print("Error searching NASA images:", e)

search_nasa_images("candle flames microgravity")
search_nasa_images("saffire flame")
search_nasa_images("BASS combustion")
search_nasa_images("CIR combustion")
