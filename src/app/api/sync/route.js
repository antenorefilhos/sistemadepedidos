import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

    const db = await getDb();
    await db.run('BEGIN TRANSACTION');

    try {
      let updatedCount = 0;
      let ignoredCount = 0;

      for (const item of productsList) {
        const { sku, preco, status, title, peso, unidade_peso, description, type } = item;

        if (!sku) {
          ignoredCount++;
          continue;
        }

        // Check if product exists by SKU
        const product = await db.get("SELECT id FROM products WHERE sku = ?", [sku]);

        if (product) {
          // Update existing product: update price and status (and weight/title/description if provided)
          let updateSql = `UPDATE products SET preco = ?, status = ?`;
          const params = [preco !== undefined ? preco : null, status || 'on'];

          if (title) {
            updateSql += `, title = ?`;
            params.push(title);
          }
          if (peso) {
            updateSql += `, peso = ?`;
            params.push(peso);
          }
          if (unidade_peso) {
            updateSql += `, unidade_peso = ?`;
            params.push(unidade_peso);
          }
          if (description) {
            updateSql += `, description = ?`;
            params.push(description);
          }

          updateSql += ` WHERE sku = ?`;
          params.push(sku);

          await db.run(updateSql, params);
          updatedCount++;
        } else if (title && type) {
          // If it doesn't exist, we can choose to insert it if enough details (title and type) are provided
          // Let's generate a random id or let SQLite auto-generate if we alter the table, but since products id is PK, we need an ID.
          // Wait, if it doesn't exist, it's safer to skip unless we have a custom generated ID or let the user manage it.
          // For now, let's skip or insert if ID is provided.
          if (item.id) {
            await db.run(
              `INSERT INTO products (id, title, slug, description, sku, peso, unidade_peso, preco, status, image_url, type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.id,
                title,
                item.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description || '',
                sku,
                peso || '',
                unidade_peso || 'gr',
                preco !== undefined ? preco : null,
                status || 'on',
                item.image_url || '',
                type
              ]
            );
            updatedCount++;
          } else {
            ignoredCount++;
          }
        } else {
          ignoredCount++;
        }
      }

      await db.run('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Sync completed',
        updated: updatedCount,
        ignored: ignoredCount
      });

    } catch (dbError) {
      await db.run('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
