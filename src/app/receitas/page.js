import { getSupabase } from '@/lib/pgDb';
import Link from 'next/link';
import RecipeImage from '@/components/RecipeImage';

export const metadata = {
  title: 'Receitas | Antenor & Filhos',
  description: 'Aprenda a preparar os melhores cortes de carne com nossas receitas exclusivas.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function stripHtml(html) {
  if (!html) return '';
  let text = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
  text = text.replace(/<[^>]*>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export default async function ReceitasPage() {
  const supabase = getSupabase();
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recipes:', error);
  }

  return (
    <div className="bg-[var(--bg-main)] text-white min-h-screen" style={{ paddingTop: '160px', paddingBottom: '120px' }}>
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="text-center mb-16 pt-10" style={{ marginBottom: '64px' }}>
          <h1 className="font-serif text-5xl md:text-6xl mb-6" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', textTransform: 'none' }}>Receitas Exclusivas</h1>
          <p className="max-w-2xl mx-auto text-lg leading-relaxed" style={{ color: 'var(--text-muted)', margin: '0 auto', fontSize: '18px', lineHeight: '1.7' }}>
            Descubra os segredos dos nossos mestres churrasqueiros. Transforme cortes premium em verdadeiras obras-primas gastronômicas na sua própria casa.
          </p>
        </div>

        {/* Recipes Grid */}
        {(!recipes || recipes.length === 0) ? (
          <div className="text-center py-20 border glass-panel" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '0px', padding: '80px 20px' }}>
            <i className="fa-solid fa-utensils text-4xl mb-4" style={{ color: 'var(--primary)', fontSize: '36px', marginBottom: '16px' }}></i>
            <p>Nenhuma receita disponível no momento. Em breve novidades!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--card-gap)' }}>
            {recipes.map(recipe => (
              <Link 
                key={recipe.id} 
                href={`/receitas/${recipe.id}`}
                className="group product-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textDecoration: 'none',
                  borderRadius: '0px',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Image Area */}
                <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000', overflow: 'hidden' }}>
                  <RecipeImage 
                    src={recipe.image_url} 
                    alt={recipe.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                  />
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 3 }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.85)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '0px'
                    }}>
                      <i className="fa-regular fa-clock"></i> {recipe.prep_time || '45 min'}
                    </div>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.85)',
                      border: '1px solid var(--border-color)',
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '0px'
                    }}>
                      <i className="fa-solid fa-users"></i> {recipe.servings ? `${recipe.servings} porções` : '4 porções'}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="font-serif text-2xl mb-3 group-hover:text-[var(--primary-hover)] transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', textTransform: 'none', margin: '0 0 12px 0' }}>
                      {recipe.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.65', margin: '0 0 24px 0' }} className="line-clamp-3">
                      {recipe.description 
                        ? stripHtml(recipe.description) 
                        : 'Uma receita clássica, preparada com excelência.'}
                    </p>
                  </div>
                  
                  <div className="group-hover:translate-x-1 transition-all" style={{ color: 'var(--primary)', gap: '8px', marginTop: 'auto', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)' }}>
                    Ver Receita Completa <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
