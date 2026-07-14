import { getSupabase } from '@/lib/pgDb';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getSupabase();
  const { data } = await supabase.from('recipes').select('title, description').eq('id', id).single();
  
  if (!data) return { title: 'Receita não encontrada' };
  
  return {
    title: `${data.title} | Antenor & Filhos Receitas`,
    description: data.description,
  };
}

export default async function RecipeDetailsPage({ params }) {
  const { id } = await params;
  const supabase = getSupabase();
  
  // Buscar a receita
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !recipe) {
    notFound();
  }

  // Se a receita tem produtos vinculados, buscar os detalhes desses produtos para montar a vitrine
  let relatedProducts = [];
  if (recipe.related_products && recipe.related_products.length > 0) {
    const { data: prods } = await supabase
      .from('products')
      .select('id, title, slug, preco, image_url, type')
      .in('id', recipe.related_products);
    if (prods) relatedProducts = prods;
  }

  return (
    <div className="bg-[var(--bg-main)] text-white min-h-screen pt-24 pb-20">
      
      {/* Banner Principal da Receita */}
      <div className="relative w-full h-[40vh] md:h-[60vh] bg-black">
        {recipe.image_url ? (
          <>
            <img 
              src={recipe.image_url} 
              alt={recipe.title} 
              className="w-full h-full object-cover opacity-60"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-full h-full hidden items-center justify-center bg-[#111]">
               <i className="fa-solid fa-utensils text-6xl text-[var(--color-gold)]/20"></i>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#111]">
             <i className="fa-solid fa-utensils text-6xl text-[var(--color-gold)]/20"></i>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container-app">
             <div className="flex gap-3 flex-wrap mb-6">
               {recipe.prep_time && (
                  <div className="bg-black/60 text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <i className="fa-regular fa-clock mr-2"></i> {recipe.prep_time}
                  </div>
               )}
               {recipe.servings && (
                  <div className="bg-black/60 text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <i className="fa-solid fa-users mr-2"></i> {recipe.servings} porções
                  </div>
               )}
               {recipe.difficulty && (
                  <div className="bg-black/60 text-[var(--color-gold)] border border-[var(--color-gold)]/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    <i className="fa-solid fa-fire-burner mr-2"></i> Dificuldade: {recipe.difficulty}
                  </div>
               )}
             </div>
             <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-4 drop-shadow-lg">{recipe.title}</h1>
          </div>
        </div>
      </div>

      <div className="container-app mt-8 md:mt-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Coluna Esquerda: Descrição e Ingredientes/Preparo */}
          <div className="w-full lg:w-2/3">
            
            {recipe.description && (
              <div 
                className="mb-12 text-lg text-[var(--color-muted)] leading-relaxed border-l-2 border-[var(--color-gold)] pl-6 italic"
                dangerouslySetInnerHTML={{ __html: recipe.description }}
              ></div>
            )}

            <div className="glass-panel p-8 md:p-12 rounded-2xl mb-12">
              <h2 className="font-serif text-3xl text-[var(--color-gold)] mb-8 border-b border-white/10 pb-4">
                Instruções de Preparo
              </h2>
              <div 
                className="prose prose-invert max-w-none text-gray-300 leading-loose prose-h3:text-[var(--color-gold)] prose-h3:font-serif prose-a:text-[var(--color-gold)]"
                dangerouslySetInnerHTML={{ __html: recipe.instructions ? recipe.instructions : recipe.description }}
              ></div>
            </div>
            
            <div className="mt-8">
               <Link href="/receitas" className="btn-outline border-white/20 text-white hover:bg-white hover:text-black">
                 <i className="fa-solid fa-arrow-left mr-2"></i> Voltar para Receitas
               </Link>
            </div>
          </div>

          {/* Coluna Direita: Carnes Recomendadas (Produtos Vinculados) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-32">
              <h3 className="font-serif text-2xl text-[var(--color-gold)] mb-6">Cortes Utilizados</h3>
              
              {relatedProducts.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {relatedProducts.map(prod => (
                    <Link 
                      key={prod.id} 
                      href={`/produtos/${prod.slug}`}
                      className="glass-panel p-4 rounded-xl flex gap-4 items-center group hover:border-[var(--color-gold)]/50 transition-colors"
                    >
                      <div className="w-20 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0 relative">
                         {prod.image_url ? (
                           <>
                             <img 
                               src={prod.im