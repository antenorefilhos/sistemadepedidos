import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';

  try {
    let sql = `
      SELECT p.*, GROUP_CONCAT(c.slug || '||' || c.name || '||' || c.type, ';;') as categories_str
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.status = 'on'
    `;
    const params = [];

    if (type) {
      sql += ` AND p.type = ?`;
      params.push(type);
    }

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
      const searchLike = `%${search}%`;
      params.push(searchLike, searchLike, searchLike);
    }

    sql += ` GROUP BY p.id`;

    // Fetch products
    let products = await queryAll(sql, params);

    // Format output and parse categories string
    products = products.map(p => {
      const categories = [];
      if (p.categories_str) {
        // SQLite GROUP_CONCAT can have duplicates or empty values if not careful, let's parse safely
        const uniqueCats = new Set();
        p.categories_str.split(';;').forEach(catStr => {
          if (catStr && !uniqueCats.has(catStr)) {
            uniqueCats.add(catStr);
            const [slug, name, catType] = catStr.split('||');
            if (slug && name) {
              categories.push({ slug, name, type: catType });
            }
          }
        });
      }

      const formatted = {
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
      return formatted;
    });

    // If filtering by category slug in JS (simpler than SQL JOIN filter for GROUP_CONCAT items)
    if (category) {
      products = products.filter(p => 
        p.categories.some(cat => cat.slug.toLowerCase() === category.toLowerCase())
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
