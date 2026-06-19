import xml.etree.ElementTree as ET
import json
import re

def parse_wp_xml(file_path, post_type):
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Namespaces
    ns = {
        'content': 'http://purl.org/rss/1.0/modules/content/',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'wp': 'http://wordpress.org/export/1.2/',
        'excerpt': 'http://wordpress.org/export/1.2/excerpt/'
    }
    
    channel = root.find('channel')
    items = []
    
    for item_node in channel.findall('item'):
        # Only process publish/draft posts of specified post_type
        p_type = item_node.find('wp:post_type', ns)
        if p_type is None or p_type.text != post_type:
            continue
            
        p_status = item_node.find('wp:status', ns)
        if p_status is None or p_status.text not in ['publish', 'draft']:
            continue
            
        post_id = item_node.find('wp:post_id', ns).text
        title = item_node.find('title').text
        slug = item_node.find('wp:post_name', ns).text
        
        # Get content/description
        content_encoded = item_node.find('content:encoded', ns).text or ''
        # Strip WP comment blocks
        description = re.sub(r'<!--.*?-->', '', content_encoded).strip()
        
        # Extract postmeta
        meta = {}
        for meta_node in item_node.findall('wp:postmeta', ns):
            key_node = meta_node.find('wp:meta_key', ns)
            val_node = meta_node.find('wp:meta_value', ns)
            if key_node is not None and val_node is not None:
                meta[key_node.text] = val_node.text
                
        # Extract categories/taxonomies
        categories = []
        for cat_node in item_node.findall('category'):
            categories.append({
                'domain': cat_node.attrib.get('domain', ''),
                'nicename': cat_node.attrib.get('nicename', ''),
                'name': cat_node.text
            })
            
        product = {
            'id': post_id,
            'title': title,
            'slug': slug,
            'description': description,
            'status': meta.get('status', 'on'),
            'sku': meta.get('_sku', ''),
            'peso': meta.get('_quantidade', '') or meta.get('peso', ''),
            'unidade_peso': meta.get('_unidade_de_peso', '') or meta.get('unidadedepeso', ''),
            'preco': meta.get('_preco', ''),
            'pontuacao': meta.get('pontuacao', ''),
            'thumbnail_id': meta.get('_thumbnail_id', ''),
            'categories': categories,
            'type': post_type
        }
        items.append(product)
        
    return items

def main():
    carnes = parse_wp_xml('carnes_export.xml', 'carnes_')
    adega = parse_wp_xml('adega_export.xml', 'adega')
    
    all_products = carnes + adega
    print(f"Parsed {len(carnes)} carnes and {len(adega)} adega products. Total: {len(all_products)}")
    
    with open('parsed_products.json', 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
        
if __name__ == '__main__':
    main()
