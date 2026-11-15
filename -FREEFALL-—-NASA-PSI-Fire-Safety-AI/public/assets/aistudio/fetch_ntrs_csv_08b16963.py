import csv
import urllib.request
import urllib.parse
import json

QUERIES = ["Saffire microgravity combustion", "BASS-II flame spread", "FLEX cool flames"]
 OUTPUT_FILE = "nasa_ntrs_live_extract.csv"

rows = []
for q in QUERIES:
    url = f"https://ntrs.nasa.gov/api/citations/search?q={urllib.parse.quote(q)}&size=15"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        for item in data.get("results", []):
            rows.append({
                "ntrs_id": f"NTRS-{item.get('id')}",
                "title": item.get("title", ""),
                "pub_date": item.get("publicationDate", "")[:10],
                "abstract": (item.get("abstract") or "").replace("\n", " ")[:400]
            })

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["ntrs_id", "title", "pub_date", "abstract"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Saved {len(rows)} lightweight NASA NTRS records to {OUTPUT_FILE}")