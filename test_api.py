import urllib.request
import json

def test_api():
    url = "https://antenorefilhos.com.br/novo/wp-json/wp/v2/carnes_?per_page=1&_embed=true"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        item = data[0]
        print(f"Keys in _embedded: {list(item.get('_embedded', {}).keys())}")
        
        # Check featured media
        media = item.get('_embedded', {}).get('wp:featuredmedia', [])
        if media:
            print("Featured Media Details:")
            print(f"  Source URL: {media[0].get('source_url')}")
            print(f"  Alt Text: {media[0].get('alt_text')}")
            print(f"  Media Details (sizes): {list(media[0].get('media_details', {}).get('sizes', {}).keys())}")
            
        # Check terms (taxonomies)
        terms = item.get('_embedded', {}).get('wp:term', [])
        print("Taxonomies Embedded:")
        for term_group in terms:
            for term in term_group:
                print(f"  Taxonomy: {term.get('taxonomy')}, ID: {term.get('id')}, Name: {term.get('name')}, Slug: {term.get('slug')}")

if __name__ == '__main__':
    test_api()
