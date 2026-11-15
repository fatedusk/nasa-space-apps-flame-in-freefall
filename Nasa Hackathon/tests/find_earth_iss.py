import urllib.request
import json

def get_asset_url(nasa_id):
    url = f"https://images-api.nasa.gov/asset/{nasa_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('collection', {}).get('items', [])
            for item in items:
                href = item.get('href', '')
                if href.endswith('~small.jpg') or href.endswith('~medium.jpg') or href.endswith('~thumb.jpg'):
                    return href
            if items:
                return items[0].get('href', '')
    except Exception as e:
        print(f"Error for {nasa_id}: {e}")
    return None

def search_id(query):
    url = f"https://images-api.nasa.gov/search?q={urllib.parse.quote(query)}&media_type=image"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        items = data.get('collection', {}).get('items', [])
        for it in items[:3]:
            d = it.get('data', [{}])[0]
            print(f"{query} -> ID: {d.get('nasa_id')} Title: {d.get('title')}")
            links = it.get('links', [{}])
            if links:
                print("  Link:", links[0].get('href'))

search_id("Earth blue marble")
search_id("International Space Station flyaround")
