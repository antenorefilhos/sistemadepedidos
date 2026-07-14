import { getSupabase } from '@/lib/pgDb';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RecipeImage from '@/components/RecipeImage';

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
    <div className="bg-[var(--bg-main)] text-white min-h-screen pt-32 pb-24">
      
      {/* Banner Principal da Receita */}
      <div className="relative w-full h-[40vh] md:h-[60vh] bg-black" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <RecipeImage 
          src={recipe.image_url} 
          alt={recipe.title} 
          className="w-full h-full object-cover opacity-60" 
          iconSizeClass="text-6xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container mx-auto px-6 md:px-12">
             <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', zIndex: 3 }}>
               <div style={{
                 background: 'rgba(0, 0, 0, 0.85)',
                 border: '1px solid var(--border-color)',
                 padding: '6px 14px',
                 fontSize: '11px',
                 fontWeight: 'bold',
                 textTransform: 'uppercase',
                 color: 'var(--primary)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 borderRadius: '0px'
               }}>
                 <i className="fa-regular fa-clock"></i> {recipe.prep_time || '45 min'}
               </div>
               <div style={{
                 background: 'rgba(0, 0, 0, 0.85)',
                 border: '1px solid var(--border-color)',
                 padding: '6px 14px',
                 fontSize: '11px',
                 fontWeight: 'bold',
                 textTransform: 'uppercase',
                 color: 'var(--primary)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 borderRadius: '0px'
               }}>
                 <i className="fa-solid fa-users"></i> {recipe.servings ? `${recipe.servings} porções` : '4 porções'}
               </div>
               <div style={{
                 background: 'rgba(0, 0, 0, 0.85)',
                 border: '1px solid var(--border-color)',
                 padding: '6px 14px',
                 fontSize: '11px',
                 fontWeight: 'bold',
                 textTransform: 'uppercase',
                 color: 'var(--primary)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px',
                 borderRadius: '0px'
               }}>
                 <i className="fa-solid fa-fire-burner"></i> {recipe.difficulty || 'Fácil'}
               </div>
             </div>
             <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white mb-4 drop-shadow-lg" style={{ fontFamily: 'var(--font-serif)', textTransform: 'none' }}>{recipe.title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 mt-12 md:mt-20">
        <div style={{ display: 'flex', flexDirection: 'row', gap: '48px', flexWrap: 'wrap' }}>
          
          {/* Coluna Esquerda: Descrição e Ingredientes/Preparo */}
          <div style={{ flex: '2 1 600px', minWidth: '320px' }}>
            
            {recipe.description && recipe.instructions && (
              <div 
                className="mb-12 text-lg leading-relaxed italic"
                style={{ color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)', paddingLeft: '24px', marginBottom: '48px' }}
                dangerouslySetInnerHTML={{ __html: recipe.description }}
              ></div>
            )}

            <div className="product-card" style={{ padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0px', marginBottom: '48px' }}>
              <h2 className="font-serif text-3xl mb-8 pb-4" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', margin: '0 0 32px 0', textTransform: 'none' }}>
                Instruções de Preparo
              </h2>
              <div 
                className="prose prose-invert max-w-none text-gray-300 leading-loose prose-h3:text-[var(--primary)] prose-h3:font-serif prose-a:text-[var(--primary)]"
                dangerouslySetInnerHTML={{ __html: recipe.instructions ? recipe.instructions : recipe.description }}
              ></div>
            </div>
            
            <div className="mt-8" style={{ marginTop: '32px' }}>
               <Link 
                 href="/receitas" 
                 className="btn"
                 style={{
                   display: 'inline-flex',
                   alignItems: 'center',
                   border: '1px solid var(--border-color)',
                   background: 'transparent',
                   color: 'white',
                   borderRadius: '0px',
                   textTransform: 'uppercase',
                   fontSize: '12px',
                   fontWeight: 'bold',
                   padding: '12px 24px',
                   letterSpacing: 'var(--ls-wider)'
                 }}
               >
                 <i className="fa-solid fa-arrow-left mr-2" style={{ marginRight: '8px' }}></i> Voltar para Receitas
               </Link>
            </div>
          </div>

          {/* Coluna Direita: Carnes Recomendadas (Produtos Vinculados) */}
          <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
            <div className="sticky top-32">
              <h3 className="font-serif text-2xl mb-6 pb-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>Cortes Utilizados</h3>
              
              {relatedProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {relatedProducts.map(prod => (
                    <Link 
                      key={prod.id} 
                      href={`/produtos/${prod.slug}`}
                      className="group product-card"
                      style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        textDecoration: 'none',
                        borderRadius: '0px',
                        padding: '16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ width: '80px', height: '80px', background: '#000', overflow: 'hidden', flexShrink: 0, position: 'relative', borderRadius: '0px' }}>
                         <RecipeImage 
                           src={prod.image_url} 
                           alt={prod.title} 
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                           iconSizeClass="text-xl"
                         />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-[var(--primary-hover)] transition-colors mb-1 line-clamp-2" style={{ margin: '0 0 4px 0', fontSize: '14px', transition: 'color var(--transition-fast)' }} dangerouslySetInnerHTML={{ __html: prod.title }}></h4>
                        <div className="font-serif text-lg" style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '18px' }}>
                          R$ {Number(prod.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                  Nenhum corte específico vinculado. Pode ser preparado com a carne de sua preferência.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
