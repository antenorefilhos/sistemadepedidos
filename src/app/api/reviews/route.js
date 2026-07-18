import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'Missing product_id parameter' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', Number(productId))
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, customer_name, rating, comment } = body;

    if (!product_id || !customer_name || !rating) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes (product_id, customer_name, rating)' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'A avaliação deve ser entre 1 e 5 estrelas' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: newReview, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: Number(product_id),
        customer_name,
        rating: Number(rating),
        comment: comment || '',
        status: 'pending' // Precisa de moderação do administrador
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
