import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const verifyAdmin = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  return password === (process.env.ADMIN_PASSWORD || 'antenor123');
};

export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const exportPath = path.resolve(process.cwd(), 'db/catalog_export.json');
    const raw = fs.readFileSync(exportPath, 'utf-8');
    const { categories, products, mappings } = JSON.parse(raw);

    const results = { categories: 0, products: 0, mappings: 0, errors: [] };

    // --- 1. Import Categories ---
    const CHUNK = 50;
    for (let i = 0; i < categories.length; i += CHUNK) {
      const chunk = categories.slice(i, i + CHUNK).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: c.type
      }));
      const { error } = await supabase
        .from('categories')
        .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
      if (error) results.errors.push(`categories batch ${i}: ${error.message}`);
      else results.categories += chunk.length;
    }

    // --- 2. Import Products ---
    for (let i = 0; i < products.length; i += CHUNK) {
      const chunk = products.slice(i, i + CHUNK).map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description || null,
        sku: p.sku || null,
        peso: p.peso || null,
        unidade_peso: p.unidade_peso || null,
        preco: p.preco !== undefined && p.preco !== null && p.preco !== '' ? parseFloat(p.preco) : null,
        status: p.status || 'on',
        image_url: p.image_url || null,
        type: p.type,
        pontuacao: p.pontuacao || null
      }));
      const { error } = await supabase
        .from('products')
        .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
      if (error) results.errors.push(`products batch ${i}: ${error.message}`);
      else results.products += chunk.length;
    }

    // --- 3. Import product_categories mappings ---
    for (let i = 0; i < mappings.length; i += CHUNK) {
      const chunk = mappings.slice(i, i + CHUNK).map(m => ({
        product_id: m.product_id,
        category_id: m.category_id
      }));
      const { error } = await supabase
        .from('product_categories')
        .upsert(chunk, { onConflict: 'product_id,category_id', ignoreDuplicates: true });
      if (error) results.errors.push(`mappings batch ${i}: ${error.message}`);
      else results.mappings += chunk.length;
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      imported: results,
      errors: results.errors
    });
  } catch (error) {
    console.error('Import catalog error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
