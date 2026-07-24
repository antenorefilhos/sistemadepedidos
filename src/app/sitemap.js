export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = 'https://antenorefilhos.com.br';

  const staticRoutes = [
    '',
    '/boutique',
    '/adega',
    '/cardapio',
    '/receitas',
    '/entregas',
    '/distribuidora',
    '/politica-de-privacidade-antenor-e-filhos'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  let dynamicRoutes = [];
  try {
    const { getSupabase } = await import('@/lib/pgDb');
    const supabase = getSupabase();

    const [prodsRes, recipesRes] = await Promise.all([
      supabase.from('products').select('slug').eq('status', 'on'),
      supabase.from('recipes').select('slug')
    ]);

    if (prodsRes.data) {
      prodsRes.data.forEach(p => {
        if (p.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/produtos/${p.slug}`,
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'daily',
            priority: 0.7,
          });
        }
      });
    }

    if (recipesRes.data) {
      recipesRes.data.forEach(r => {
        if (r.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/receitas/${r.slug}`,
            lastModified: new Date().toISOString().split('T')[0],
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }
      });
    }
  } catch (e) {
    console.error('Error generating dynamic sitemap routes:', e);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
