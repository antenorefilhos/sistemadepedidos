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
    <div className="bg-[var(--bg-main)] text-white min-h-screen pt-24 pb-20">
      <div className="container-app">
        
        {/* Header */}
        <div className="text-center mb-16 pt-10">
          <h1 className="font-serif text-5xl md:text-6xl text-[var(--color-gold)] mb-6">Receitas Exclusivas</h1>
          <p className="text-[var(--color-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
            Descubra os segredos dos nossos mestres churrasqueiros. Transforme cortes premium em verdadeiras obras-primas gastronômicas na sua própria casa.
          </p>
        </div>

        {/* Recipes Grid */}
        {(!recipes || recipes.length === 0) ? (
          <div className="text-center text-[var(--color-muted)] py-20 border border-white/5 rounded-2xl glass-panel">
            <i className="fa-solid fa-utensils text-4xl mb-4 text-[var(--color-gold)]"></i>
            <p>Nenhuma receita disponível no momento. Em breve novidades!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {recipes.map(recipe => (
              <Link 
                key={recipe.id} 
                href={`/receitas/${recipe.id}`}
                className="group hover:border-[var(--color-gold)]/50 transition-all duration-300 transform hover:-translate-y-1 glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textDecoration: 'none',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'rgba(9, 10, 13, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Image Area */}
                <div style={{ position: 'relative', width: '100%', height: '220px', background: '#000', overflow: 'hidden' }}>
                  <RecipeImage 
                    src={recipe.image_url} 
                    alt={recipe.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                  />
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#e3cfaf] flex items-center gap-1.5">
                      <i className="fa-regular fa-clock"></i> {recipe.prep_time || '45 min'}
                    </div>
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#e3cfaf] flex items-center gap-1.5">
                      <i className="fa-solid fa-users"></i> {recipe.servings ? `${recipe.servings} porções` : '4 porções'}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6 relative z-10 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-2xl text-[var(--color-gold)] mb-3 group-hover:text-white transition-colors line-clamp-2">
                      {recipe.title}
                    </h3>
                    <p className="text-[var(--color-muted)] text-sm line-clamp-3 mb-6">
                      {recipe.description 
                        ? stripHtml(recipe.description) 
                        : 'Uma receita clássica, preparada com excelência.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center text-xs font-bold uppercase tracking-widest text-[var(--color-gold)] group-hover:text-white transition-colors mt-auto">
                    Ver Receita Completa <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
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
