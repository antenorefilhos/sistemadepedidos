import { getSupabase } from '@/lib/pgDb';
import { notFound } from 'next/navigation';
import ProductDetails from './ProductDetails';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch (e) {
      return slug;
    }
  })();

  const variations = Array.from(new Set([
    slug,
    slug.toLowerCase(),
    decoded,
    decoded.toLowerCase(),
    encodeURIComponent(decoded).toLowerCase(),
    encodeURIComponent(decoded).toUpperCase()
  ]));

  const supabase = getSupabase();
  const { data: product } = await supabase
    .from('products')
    .select('title, description, image_url')
    .in('slug', variations)
    .eq('status', 'on')
    .limit(1)
    .maybeSingle();

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
  
  const decoded = (() => {
    try {
      return decodeURIComponent(slug);
    } catch (e) {
      return slug;
    }
  })();

  const variations = Array.from(new Set([
    slug,
    slug.toLowerCase(),
    decoded,
    decoded.toLowerCase(),
    encodeURIComponent(decoded).toLowerCase(),
    encodeURIComponent(decoded).toUpperCase()
  ]));

  // 1. Fetch main product details with joined categories
  const supabase = getSupabase();

  const { data: p } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        categories ( id, name, slug, type )
      )
    `)
    .in('slug', variations)
    .eq('status', 'on')
    .limit(1)
    .maybeSingle();

  if (!p) {
    notFound();
  }

  // Parse categories safely
  const categories = (p.product_categories || [])
    .map(pc => pc.categories)
    .filter(Boolean);

  const formattedProduct = {
    ...p,
    categories
  };

  // 2. Fetch related products of the same type
  const { data: related } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        categories ( id, name, slug, type )
      )
    `)
    .eq('type', p.type)
    .neq('id', p.id)
    .eq('status', 'on')
    .limit(4);

  const formattedRelated = (related || []).map(rp => {
    const rCats = (rp.product_categories || [])
      .map(pc => pc.categories)
      .filter(Boolean);
    
    return {
      ...rp,
      categories: rCats
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    image: p.image_url ? [p.image_url] : [],
    description: p.description?.replace(/<[^>]*>?/gm, '') || p.title,
    sku: p.sku || `PROD-${p.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Antenor & Filhos'
    },
    offers: {
      '@type': 'Offer',
      url: `https://antenorefilhos.com.br/produtos/${p.slug}`,
      priceCurrency: 'BRL',
      price: p.preco || '0.00',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Antenor & Filhos'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails 
        product={formattedProduct} 
        relatedProducts={formattedRelated} 
      />
    </>
  );
}
