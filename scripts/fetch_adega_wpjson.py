"""
Fetch all Adega (wine) products from the WordPress site.
Attempts multiple API strategies to find and extract wine product data.
"""
import urllib.request
import json
import re
import ssl

# Disable SSL verification for local development
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/json'
}

def try_url(url):
    """Try to fetch a URL and return its content."""
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"  Failed: {e}")
        return None

def main():
    # Strategy 1: Try standard WP REST API endpoints
    endpoints = [
        "https://antenorefilhos.com.br/novo/wp-json/wp/v2/adega?per_page=100&_embed=true",
        "https://antenorefilhos.com.br/novo/wp-json/wp/v2/adega?per_page=100",
        "https://antenorefilhos.com.br/novo/?rest_route=/wp/v2/adega&per_page=100",
        "https://antenorefilhos.com.br/novo/?rest_route=/wp/v2/adega&per_page=100&_embed=true",
        "https://antenorefilhos.com.br/novo/wp-json/jet-cct/adega",
        "https://antenorefilhos.com.br/novo/wp-json/",
    ]
    
    for url in endpoints:
        print(f"Trying: {url}")
        result = try_url(url)
        if result:
            print(f"  SUCCESS! Got {len(result)} bytes")
            # Try to parse as JSON
            try:
                data = json.loads(result)
                if isinstance(data, list):
                    print(f"  Found {len(data)} items")
                    for item in data[:3]:
                        title = item.get('title', {})
                        if isinstance(title, dict):
                            title = title.get('rendered', str(title))
                        print(f"    - {title}")
                elif isinstance(data, dict):
                    print(f"  Keys: {list(data.keys())[:10]}")
                    # Check for routes
                    if 'routes' in data:
                        routes = [r for r in data['routes'].keys() if 'adega' in r.lower() or 'carnes' in r.lower() or 'wine' in r.lower()]
                        print(f"  Matching routes: {routes}")
                return data
            except json.JSONDecodeError:
                print(f"  Not JSON, got HTML ({len(result)} bytes)")
                # Check if it's an HTML page with product data
                titles = re.findall(r'<a class="row-title"[^>]*>([^<]+)</a>', result)
                if titles:
                    print(f"  Found {len(titles)} products in HTML!")
                    for t in titles:
                        print(f"    - {t}")
        else:
            print(f"  No result")
    
    print("\nDone.")

if __name__ == '__main__':
    main()
