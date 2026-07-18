import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/pgDb';

export const dynamic = 'force-dynamic';

const getRole = (request) => {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get('auth') || request.headers.get('Authorization');
  const adminPass = process.env.ADMIN_PASSWORD || 'Aef@1945*';
  const managerPass = process.env.MANAGER_PASSWORD || 'manager123';
  if (password === adminPass) return 'admin';
  if (password === managerPass) return 'manager';
  return null;
};

export async function GET(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    // Puxamos as avaliações trazendo também o título do produto relacionado
    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        products ( title )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedReviews = reviews.map(r => ({
      ...r,
      product_title: r.products?.title || 'Produto Removido',
      products: undefined
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { reviewId, status } = body;

    if (!reviewId || !status) {
      return NextResponse.json({ error: 'Missing reviewId or status' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('product_reviews')
      .update({ status })
      .eq('id', Number(reviewId));

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review status updated' });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const role = getRole(request);
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'Missing review ID' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', Number(reviewId));

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
