import { getSupabase } from '@/lib/pgDb';
import Link from 'next/link';

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map(recipe => (
              <Link 
                key={recipe.id} 
                href={`/receitas/${recipe.id}`}
                className="group relative block rounded-2xl overflow-hidden glass-panel hover:border-[var(--color-gold)]/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Image Area */}
                <div className="relative aspect-[4/3] bg-[#000] overflow-hidden">
                  {recipe.image_url ? (
                    <>
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full hidden items-center justify-center bg-[#111]">
                        <i className="fa-solid fa-utensils text-4xl text-[var(--color-gold)]/30"></i>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#111]">
                      <i className="fa-solid fa-fire-burner text-4xl text-[var(--color-gold)]/30"></i>
                    </div>
                  )}
                  {/* Badge */}
                  {recipe.prep_time && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#e3cfaf]">
                      <i className="fa-regular fa-clock mr-1"></i> {recipe.prep_time}
                    </div>
                  )}
                </div>

                {/* Content Area */}
       