import { queryOne, queryAll } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProductDetails from './ProductDetails';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const product = await queryOne(
    `SELECT title, description, image_url FROM products WHERE slug = ? AND status = 'on'`,
    [slug]
  );
  
  if (!product) {
    return {
      title: 'Produto Não Encontrado | Antenor e Filhos',
      description: 'O produto solicitado não está disponível no momento.'
    };
  }

  return {
    title: `${product.title} | Antenor e Filhos`,
    description: product.description || `Adquira ${product.title} diretamente na boutique ou adega da Antenor & Filhos em Itaipava, Petrópolis. Faça seu pedido de orçamento online.`,
    openGraph: {
      title: `${product.title} | Antenor e Filhos`,
      description: product.description || `Corte nobre ou rótulo exclusivo de adega na serra imperial.`,
      images: product.image_url ? [{ url: product.image_url }] : []
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  
  // 1. Fetch main product details with joined categories
  const p = await queryOne(
    `SELECT p.*, GROUP_CONCAT(c.id || '||' || c.slug || '||' || c.name || '||' || c.type, ';;') as categories_str
     FROM products p
     LEFT JOIN product_categories pc ON p.id = pc.product_id
     LEFT JOIN categories c ON pc.category_id = c.id
     WHERE p.slug = ? AND p.status = 'on'
     GROUP BY p.id`,
    [slug]
  );

  if (!p) {
    notFound();
  }

  // Parse categories string safely
  const categories = [];
  if (p.categories_str) {
    const uniqueCats = new Set();
    p.categories_str.split(';;').forEach(catStr => {
      if (catStr && !uniqueCats.has(catStr)) {
        uniqueCats.add(catStr);
        const [id, cSlug, name, catType] = catStr.split('||');
        if (cSlug && name) {
          categories.push({ id: Number(id), slug: cSlug, name, type: catType });
        }
      }
    });
  }

  const formattedProduct = {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    sku: p.sku,
    peso: p.peso,
    unidade_peso: p.unidade_peso,
    preco: p.preco,
    image_url: p.image_url,
    type: p.type,
    pontuacao: p.pontuacao,
    categories
  };

  // 2. Fetch related products of the same type and categories if possible
  // To keep it fast, we fetch other active products of the same type, excluding current
  let related = await queryAll(
    `SELECT p.*, GROUP_CONCAT(c.id || '||' || c.slug || '||' || c.name || '||' || c.type, ';;') as categories_str
     FROM products p
     LEFT JOIN product_categories pc ON p.id = pc.product_id
     LEFT JOIN categories c ON pc.category_id = c.id
     WHERE p.type = ? AND p.id != ? AND p.status = 'on'
     GROUP BY p.id
     ORDER BY RANDOM()
     LIMIT 4`,
    [p.type, p.id]
  );

  const formattedRelated = related.map(rp => {
    const rCats = [];
    if (rp.categories_str) {
      const uniqueCats = new Set();
      rp.categories_str.split(';;').forEach(catStr => {
        if (catStr && !uniqueCats.has(catStr)) {
          uniqueCats.add(catStr);
          const [id, cSlug, name, catType] = catStr.split('||');
          if (cSlug && name) {
            rCats.push({ id: Number(id), slug: cSlug, name, type: catType });
          }
        }
      });
    }
    return {
      id: rp.id,
      title: rp.title,
      slug: rp.slug,
      description: rp.description,
      sku: rp.sku,
      peso: rp.peso,
      unidade_peso: rp.unidade_peso,
      preco: rp.preco,
      image_url: rp.image_url,
      type: rp.type,
      pontuacao: rp.pontuacao,
      categories: rCats
    };
  });

  return (
    <ProductDetails 
      product={formattedProduct} 
      relatedProducts={formattedRelated} 
    />
  );
}
