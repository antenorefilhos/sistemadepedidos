import { getSupabase } from '@/lib/pgDb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RecipeImage from '@/components/RecipeImage';
import InteractiveIngredients from '@/components/InteractiveIngredients';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = getSupabase();
  
  // Tenta buscar pelo slug primeiro
  let { data } = await supabase.from('recipes').select('title, description').eq('slug', slug).single();
  
  // Fallback para ID
  if (!data) {
    const { data: fallbackData } = await supabase.from('recipes').select('title, description').eq('id', slug).single();
    if (fallbackData) data = fallbackData;
  }
  
  if (!data) return { title: 'Receita não encontrada' };
  
  return {
    title: `${data.title} | Antenor & Filhos Receitas`,
    description: data.description,
  };
}

export default async function RecipeDetailsPage({ params }) {
  const { slug } = await params;
  const supabase = getSupabase();
  
  // Buscar a receita pelo slug
  let { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fallback para buscar pelo ID
  if (error || !recipe) {
    const { data: fallbackRecipe, error: fallbackError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', slug)
      .single();
      
    if (fallbackRecipe) {
      recipe = fallbackRecipe;
      error = null;
    }
  }

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    image: recipe.image_url ? [recipe.image_url] : [],
    description: recipe.description?.replace(/<[^>]*>?/gm, '') || recipe.title,
    prepTime: 'PT45M',
    recipeYield: recipe.servings || '4 porções',
    author: {
      '@type': 'Organization',
      name: 'Chef Antenor & Filhos'
    }
  };

  return (
    <div className="bg-[var(--bg-main)] text-white min-h-screen" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Imagem de Destaque no Topo */}
        <div 
          className="w-full overflow-hidden relative shadow-2xl"
          style={{ aspectRatio: '16/9' }}
        >
          <RecipeImage 
            src={recipe.image_url} 
            alt={recipe.title} 
            className="w-full h-full object-cover" 
            iconSizeClass="text-7xl"
          />
        </div>

        {/* Título & Badges de Informação */}
        <div className="mt-6 mb-8">
          <h1 
            className="text-2xl md:text-4xl text-white mb-4 font-bold" 
            style={{ fontFamily: 'var(--font-serif)', lineHeight: '1.25', textTransform: 'none' }}
          >
            {recipe.title}
          </h1>
          
          <div className="flex flex-wrap gap-2">
            {[{
              icon: 'fa-regular fa-clock',
              label: recipe.prep_time || '45 min'
            }, {
              icon: 'fa-solid fa-users',
              label: recipe.servings ? `${recipe.servings} porções` : '4 porções'
            }, {
              icon: 'fa-solid fa-fire-burner',
              label: recipe.difficulty || 'Fácil'
            }].map((badge, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.5px'
              }}>
                <i className={`${badge.icon}`} style={{ fontSize: '11px' }}></i>
                {badge.label}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo Empilhado Verticalmente (Coluna Única) */}
        <div className="flex flex-col gap-6">
          
          {recipe.description && (
            <div 
              className="text-base leading-relaxed italic"
              style={{ color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)', paddingLeft: '16px', fontSize: '15px' }}
              dangerouslySetInnerHTML={{ __html: recipe.description }}
            ></div>
          )}

          {/* Bloco de Ingredientes com Checklist Interativo */}
          {recipe.ingredients && (
            <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', margin: '0 0 20px 0', paddingBottom: '12px', fontSize: '20px', textTransform: 'none' }}>
                <i className="fa-solid fa-pepper-hot" style={{ fontSize: '16px' }}></i>
                <span>Ingredientes</span>
              </h2>
              <InteractiveIngredients html={recipe.ingredients} />
            </div>
          )}

          {/* Bloco de Modo de Preparo */}
          {recipe.instructions && (
            <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h2 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', margin: '0 0 20px 0', paddingBottom: '12px', fontSize: '20px', textTransform: 'none' }}>
                <i className="fa-solid fa-kitchen-set" style={{ fontSize: '16px' }}></i>
                <span>Modo de Preparo</span>
              </h2>
              <div 
                className="prose prose-invert max-w-none text-gray-300 prose-ol:list-decimal prose-ol:pl-4"
                style={{ fontSize: '15px', lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: recipe.instructions }}
              ></div>
            </div>
          )}

          {/* Fallback de receitas antigas sem divisão ingredientes/preparo */}
          {!recipe.ingredients && !recipe.instructions && (
            <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', margin: '0 0 20px 0', paddingBottom: '12px', fontSize: '20px', textTransform: 'none' }}>
                Ingredientes & Preparo
              </h2>
              <div 
                className="prose prose-invert max-w-none text-gray-300"
                style={{ fontSize: '15px', lineHeight: '1.8' }}
                dangerouslySetInnerHTML={{ __html: recipe.description }}
              ></div>
            </div>
          )}

          {/* Cortes Utilizados (Vitrine no Rodapé) */}
          <div className="mt-2">
            <h3 
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '12px', fontSize: '20px', textTransform: 'none' }}
            >
              Cortes Utilizados
            </h3>
            
            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {relatedProducts.map(prod => (
                  <Link 
                    key={prod.id} 
                    href={`/produtos/${prod.slug}`}
                    className="group"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      padding: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', overflow: 'hidden', position: 'relative', marginBottom: '10px' }}>
                       <RecipeImage 
                         src={prod.image_url} 
                         alt={prod.title} 
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         iconSizeClass="text-2xl"
                       />
                    </div>
                    <h4 
                      className="text-white group-hover:text-[var(--primary-hover)] line-clamp-2" 
                      style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', transition: 'color 0.2s ease' }} 
                      dangerouslySetInnerHTML={{ __html: prod.title }}
                    ></h4>
                    <div style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '16px' }}>
                      R$ {Number(prod.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                Nenhum corte específico vinculado. Pode ser preparado com a carne de sua preferência.
              </div>
            )}
          </div>

          {/* Ação de Voltar */}
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
             <Link 
               href="/receitas" 
               style={{
                 display: 'inline-flex',
                 alignItems: 'center',
                 border: '1px solid var(--border-color)',
                 background: 'transparent',
                 color: 'white',
                 textTransform: 'uppercase',
                 fontSize: '11px',
                 fontWeight: '600',
                 padding: '10px 20px',
                 letterSpacing: '1px',
                 textDecoration: 'none',
                 transition: 'all 0.2s ease'
               }}
             >
               <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px', fontSize: '10px' }}></i> Voltar para Receitas
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
