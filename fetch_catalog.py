import urllib.request
import json
import re
import time

def fetch_all_posts(post_type):
    page = 1
    all_posts = []
    
    while True:
        url = f"https://antenorefilhos.com.br/novo/wp-json/wp/v2/{post_type}?per_page=50&page={page}&_embed=true"
        print(f"Fetching {post_type} (page {page})...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                if not data:
                    break
                all_posts.extend(data)
                print(f"Fetched {len(data)} items.")
                if len(data) < 50:
                    break
                page += 1
                time.sleep(0.5) # Avoid hammering
        except Exception as e:
            # Usually a 400 error means we went past the last page
            print(f"Finished or stopped: {e}")
            break
            
    return all_posts

def parse_post(post, post_type):
    # Description clean up
    content_html = post.get('content', {}).get('rendered', '')
    # Strip HTML tags but keep some formatting, or strip completely for simple descriptions
    # Let's keep a clean plain text description
    description = re.sub(r'<[^>]+>', '', content_html).strip()
    
    # Meta fields
    meta = post.get('meta', {})
    
    # Image extraction
    image_url = ""
    featured_media = post.get('_embedded', {}).get('wp:featuredmedia', [])
    if featured_media:
        image_url = featured_media[0].get('source_url', '')
        
    # Categories / taxonomies
    taxonomies = {}
    wp_terms = post.get('_embedded', {}).get('wp:term', [])
    for term_group in wp_terms:
        for term in term_group:
            tax_name = term.get('taxonomy')
            if tax_name not in taxonomies:
                taxonomies[tax_name] = []
            taxonomies[tax_name].append({
                'id': term.get('id'),
                'name': term.get('name'),
                'slug': term.get('slug')
            })
            
    return {
        'id': post.get('id'),
        'title': post.get('title', {}).get('rendered', ''),
        'slug': post.get('slug'),
        'description': description,
        'status': meta.get('status', 'on'),
        'sku': meta.get('_sku', ''),
        'peso': meta.get('_quantidade', '') or meta.get('peso', ''),
        'unidade_peso': meta.get('_unidade_de_peso', '') or meta.get('unidadedepeso', ''),
        'preco': meta.get('_preco', ''),
        'pontuacao': meta.get('pontuacao', ''),
        'image_url': image_url,
        'taxonomies': taxonomies,
        'type': post_type
    }

def main():
    print("Starting WordPress catalog retrieval via REST API...")
    
    raw_carnes = fetch_all_posts('carnes_')
    raw_adega = fetch_all_posts('adega')
    
    parsed_carnes = [parse_post(p, 'carnes_') for p in raw_carnes]
    parsed_adega = [parse_post(p, 'adega') for p in raw_adega]
    
    catalog = {
        'carnes': parsed_carnes,
        'adega': parsed_adega,
        'total_count': len(parsed_carnes) + len(parsed_adega)
    }
    
    with open('wp_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        
    print(f"Catalog saved to wp_catalog.json. Saved {len(parsed_carnes)} Meats and {len(parsed_adega)} Wines.")

if __name__ == '__main__':
    main()
