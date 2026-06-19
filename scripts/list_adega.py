import urllib.request, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://antenorefilhos.com.br/novo/?rest_route=/wp/v2/adega&per_page=100&_embed=true'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
resp = urllib.request.urlopen(req, context=ctx)
data = json.loads(resp.read().decode('utf-8'))

print(f"Total adega products from WP REST: {len(data)}")
for i in data:
    title = i.get('title', {}).get('rendered', 'N/A')
    status = i.get('status', '?')
    featured = i.get('_embedded', {}).get('wp:featuredmedia', [{}])
    img = featured[0].get('source_url', '') if featured else ''
    print(f"  ID:{i['id']} | {title} | status:{status} | img:{img[:60]}...")

# Also check drafts
url2 = 'https://antenorefilhos.com.br/novo/?rest_route=/wp/v2/adega&per_page=100&status=draft'
try:
    req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    resp2 = urllib.request.urlopen(req2, context=ctx)
    drafts = json.loads(resp2.read().decode('utf-8'))
    print(f"\nDrafts: {len(drafts)}")
except Exception as e:
    print(f"\nCouldn't fetch drafts: {e}")
