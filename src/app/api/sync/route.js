import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.SYNC_TOKEN || 'antenor_sync_secret_token_123'; // Default fallback for dev

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const productsList = await request.json(); // Expected: array of products

    if (!Array.isArray(productsList)) {
      return NextResponse.json({ error: 'Body must be an array of products' }, { status: 400 });
    }

    const supabase = getSupabase();
    let updatedCount = 0;
    let ignoredCount = 0;

    for (const item of productsList) {
      const { sku, preco, status, title, peso, unidade_peso, description, type } = item;

      if (!sku) {
        ignoredCount++;
        continue;
      }

      // Check if product exists by SKU in Supabase
      const { data: product, error: selectError } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .maybeSingle();

      if (selectError) {
        console.error(`Error querying product by SKU ${sku}:`, selectError);
        ignoredCount++;
        continue;
      }

      if (product) {
        // Update existing product: update price and status (and weight/title/description if provided)
        const updatePayload = {
          preco: preco !== undefined ? (preco !== null ? Number(preco) : null) : null,
          status: status || 'on'
        };

        if (title) updatePayload.title = title;
        if (peso) updatePayload.peso = peso;
        if (unidade_peso) updatePayload.unidade_peso = unidade_peso;
        if (description) updatePayload.description = description;

        const { error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('sku', sku);

        if (updateError) {
          console.error(`Error updating product by SKU ${sku}:`, updateError);
          ignoredCount++;
        } else {
          updatedCount++;
        }
      } else if (title && type && item.id) {
        // If it doesn't exist, we can choose to insert it if enough details (title, type and id) are provided
        const insertPayload = {
          id: Number(item.id),
          title,
          slug: item.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: description || '',
          sku,
          peso: peso || '',
          unidade_peso: unidade_peso || 'gr',
          preco: preco !== undefined ? (preco !== null ? Number(preco) : null) : null,
          status: status || 'on',
          image_url: item.image_url || '',
          type
        };

        const { error: insertError } = await supabase
          .from('products')
          .insert(insertPayload);

        if (insertError) {
          console.error(`Error inserting product by SKU ${sku}:`, insertError);
          ignoredCount++;
        } else {
          updatedCount++;
        }
      } else {
        ignoredCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed in Supabase',
      updated: updatedCount,
      ignored: ignoredCount
    });

  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
