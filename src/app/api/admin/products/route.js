import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'antenor123';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

// GET: List all products with their categories
export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          categories ( id, name, slug, type )
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;

    const result = products.map(p => ({
      ...p,
      categories: (p.product_categories || []).map(pc => pc.categories).filter(Boolean),
      product_categories: undefined
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a product (Admin only)
export async function POST(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { 
      title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao, categoryIds, 
      uva, safra, origem, produtor, teor_alcoolico, temperatura,
      enologo, volume, amadurecimento, potencial_guarda, visual, olfativo, gustativo, harmonizacao
    } = await request.json();

    if (!title || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Insert product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        title, slug, description: description || null,
        sku: sku || null, peso: peso || null,
        unidade_peso: unidade_peso || null,
        preco: preco !== '' && preco != null ? parseFloat(preco) : null,
        status: status || 'on',
        image_url: image_url || null,
        type, pontuacao: pontuacao || null,
        uva: uva || null, safra: safra || null, origem: origem || null,
        produtor: produtor || null, teor_alcoolico: teor_alcoolico || null, temperatura: temperatura || null,
        enologo: enologo || null, volume: volume || null, amadurecimento: amadurecimento || null,
        potencial_guarda: potencial_guarda || null, visual: visual || null, olfativo: olfativo || null,
        gustativo: gustativo || null, harmonizacao: harmonizacao || null
      })
      .select('id')
      .single();

    if (prodError) throw prodError;
    const productId = product.id;

    // Link categories
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const catMaps = categoryIds.map(catId => ({ product_id: productId, category_id: catId }));
      const { error: catError } = await supabase.from('product_categories').insert(catMaps);
      if (catError) throw catError;
    }

    return NextResponse.json({ success: true, productId });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a product (Admin only)
export async function PUT(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { 
      id, title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type, pontuacao, categoryIds, 
      uva, safra, origem, produtor, teor_alcoolico, temperatura,
      enologo, volume, amadurecimento, potencial_guarda, visual, olfativo, gustativo, harmonizacao
    } = await request.json();

    if (!id || !title || !slug || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        title, slug, description: description || null,
        sku: sku || null, peso: peso || null,
        unidade_peso: unidade_peso || null,
        preco: preco !== '' && preco != null ? parseFloat(preco) : null,
        status, image_url: image_url || null,
        type, pontuacao: pontuacao || null,
        uva: uva || null, safra: safra || null, origem: origem || null,
        produtor: produtor || null, teor_alcoolico: teor_alcoolico || null, temperatura: temperatura || null,
        enologo: enologo || null, volume: volume || null, amadurecimento: amadurecimento || null,
        potencial_guarda: potencial_guarda || null, visual: visual || null, olfativo: olfativo || null,
        gustativo: gustativo || null, harmonizacao: harmonizacao || null
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Replace category mappings
    await supabase.from('product_categories').delete().eq('product_id', id);

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const catMaps = categoryIds.map(catId => ({ product_id: id, category_id: catId }));
      const { error: catError } = await supabase.from('product_categories').insert(catMaps);
      if (catError) throw catError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a product (Admin only)
export async function DELETE(request) {
  const role = getRole(request);
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    if (!productId) return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });

    const supabase = getSupabase();
    // product_categories CASCADE handles mappings
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
