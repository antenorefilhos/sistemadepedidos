'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function BiolinkView({ slug }) {
  const [biolink, setBiolink] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBiolink() {
      try {
        const res = await fetch(`/api/settings`);
        if (!res.ok) throw new Error('Falha ao carregar configurações');
        
        // Carrega o biolink via Supabase REST API
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Credenciais do Supabase não configuradas no ambiente.');
        }

        // Fetch do biolink principal
        const bioRes = await fetch(`${supabaseUrl}/rest/v1/biolinks?slug=eq.${slug}&select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        });
        if (!bioRes.ok) throw new Error('Biolink não encontrado');
        const bioData = await bioRes.json();
        
        if (!bioData || bioData.length === 0) {
          setError('Biolink não encontrado');
          setLoading(false);
          return;
        }

        const bio = bioData[0];
        setBiolink(bio);

        // Fetch dos blocos internos
        const blocksRes = await fetch(`${supabaseUrl}/rest/v1/biolink_blocks?biolink_id=eq.${bio.id}&is_enabled=eq.true&order=sort_order.asc&select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        });
        
        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          setBlocks(blocksData);
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar o link.');
      } finally {
        setLoading(false);
      }
    }

    loadBiolink();
  }, [slug]);

  // Esconder e limpar estilos globais de scrollbar e headers desnecessários
  useEffect(() => {
    // Esconde o header e footer padrão do site caso a rota mude e tenhamos um container local
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';

    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-primary">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !biolink) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black text-center p-6">
        <h2 className="text-xl font-bold text-error mb-2">Biolink indisponível</h2>
        <p className="text-base-content/60 text-sm">{error || 'Não foi possível encontrar a página requisitada.'}</p>
      </div>
    );
  }

  // Estilo de fundo baseado nos gradientes
  const backgroundStyle = {
    background: `linear-gradient(135deg, ${biolink.background_color_one || '#0F0D09'} 0%, ${biolink.background_color_two || '#7F6346'} 100%)`,
    minHeight: '100vh',
    color: biolink.text_color || '#ffffff'
  };

  const trackBlockClick = async (blockId) => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) return;
      
      // Incrementa cliques localmente de forma fire-and-forget
      fetch(`${supabaseUrl}/rest/v1/biolink_blocks?id=eq.${blockId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ clicks: (blocks.find(b => b.id === blockId)?.clicks || 0) + 1 })
      });
    } catch (e) {}
  };

  return (
    <div style={backgroundStyle} className="w-full flex justify-center py-12 px-4 select-none animate-[fadeIn_0.4s_ease]">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
        
        {/* Renderiza blocos na ordem */}
        {blocks.map((block) => {
          const settings = block.settings || {};
          
          switch (block.type) {
            case 'avatar':
              return (
                <div key={block.id} className="avatar justify-center my-2 flex w-full">
                  <div className="w-24 h-24 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-black/40 relative">
                    <img
                      src={settings.image || '/uploads/avatars/d16937e571451a66fe20d405535fdbc7.png'}
                      alt={settings.image_alt || 'Avatar'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              );

            case 'heading':
              const Tag = settings.heading_type || 'h2';
              return (
                <Tag
                  key={block.id}
                  style={{ color: settings.text_color || 'white' }}
                  className="font-bold tracking-tight text-center my-1 w-full text-lg uppercase font-serif"
                >
                  {settings.text}
                </Tag>
              );

            case 'paragraph':
              return (
                <p
                  key={block.id}
                  style={{ color: settings.text_color || '#d7b994' }}
                  className="text-center text-sm max-w-sm mb-2 opacity-85 leading-relaxed"
                >
                  {settings.text}
                </p>
              );

            case 'link':
              // Botões premium com transições suaves e design refinado
              return (
                <a
                  key={block.id}
                  href={block.location_url}
                  onClick={() => trackBlockClick(block.id)}
                  target={settings.open_in_new_tab === 1 || settings.open_in_new_tab === true ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="btn btn-block py-4 h-auto min-h-12 border-0 flex justify-center items-center shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  style={{
                    backgroundColor: settings.background_color || '#ffffff',
                    color: settings.text_color || '#000000',
                    borderRadius: settings.border_radius === 'round' ? '9999px' : '8px',
                    border: settings.border_width ? `${settings.border_width}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'}` : 'none'
                  }}
                >
                  {settings.image && (
                    <img src={settings.image} alt="" className="w-5 h-5 rounded-full mr-2 object-cover" />
                  )}
                  <span className="font-semibold tracking-wide text-sm">{settings.name}</span>
                </a>
              );

            case 'phone_collector':
              return (
                <div
                  key={block.id}
                  className="card w-full shadow-lg p-5 border border-primary/20 backdrop-blur-md bg-black/40 rounded-xl"
                >
                  <h3 className="text-center font-bold text-sm text-primary mb-3">
                    {settings.name || 'Receber Promoções no WhatsApp'}
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const phone = formData.get('phone');
                      const name = formData.get('name');
                      
                      // Encaminhar inscrição para API WhatsApp ou Persistir Leads no futuro
                      if (phone) {
                        const message = `Olá, gostaria de receber promoções de carnes e vinhos da Antenor e Filhos! Nome: ${name || 'Cliente'}`;
                        window.open(`https://api.whatsapp.com/send?phone=5524988650462&text=${encodeURIComponent(message)}`, '_blank');
                      }
                    }}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="text"
                      name="name"
                      placeholder={settings.name_placeholder || 'Nome'}
                      className="input input-bordered input-sm w-full bg-black/30 border-white/20 text-white rounded-md text-xs placeholder-white/40 focus:border-primary!"
                    />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder={settings.phone_placeholder || 'WhatsApp'}
                      className="input input-bordered input-sm w-full bg-black/30 border-white/20 text-white rounded-md text-xs placeholder-white/40 focus:border-primary!"
                    />
                    <button type="submit" className="btn btn-primary btn-sm w-full rounded-md text-xs mt-1">
                      {settings.button_text || 'Cadastrar'}
                    </button>
                  </form>
                </div>
              );

            default:
              return null;
          }
        })}

        {/* Branding discreto de rodapé */}
        <div className="text-xs opacity-50 mt-8 text-center tracking-wider">
          © {new Date().getFullYear()} Antenor & Filhos
        </div>
      </div>
    </div>
  );
}
