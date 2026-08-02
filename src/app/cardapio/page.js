'use client';

import { useState, useEffect } from 'react';

const DEFAULT_IMAGES = {
  food: 'https://iwcgjjfcckkolrwjheqr.supabase.co/storage/v1/object/public/imagens/cardapios/alacarte.jpg',
  drinks: 'https://iwcgjjfcckkolrwjheqr.supabase.co/storage/v1/object/public/imagens/cardapios/bebidas.jpg',
  breakfast: 'https://iwcgjjfcckkolrwjheqr.supabase.co/storage/v1/object/public/imagens/cardapios/cafe.jpg'
};

export default function CardapioPage() {
  const [activeTab, setActiveTab] = useState('food'); // 'food', 'drinks', or 'breakfast'
  const [images, setImages] = useState(DEFAULT_IMAGES);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const cardapioData = data.find(item => item.key === 'cardapio_images');
        if (cardapioData && cardapioData.value) {
          setImages({
            food: cardapioData.value.food || DEFAULT_IMAGES.food,
            drinks: cardapioData.value.drinks || DEFAULT_IMAGES.drinks,
            breakfast: cardapioData.value.breakfast || DEFAULT_IMAGES.breakfast
          });
        }
      })
      .catch(err => console.error('Error fetching cardapio images:', err));
  }, []);

  useEffect(() => {
    document.title = "Nosso Cardápio À La Carte, Café da Manhã e Carta de Vinhos | Antenor e Filhos";
  }, []);

  return (
    <div className="page-wrapper" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '10px'
          }}>
            Espaço Gourmet Itaipava
          </span>
          <h1 style={{ fontSize: '38px', color: 'white', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
            Nosso Cardápio
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--primary)', margin: '0 auto 20px auto' }}></div>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
            Nossas carnes preparadas na brasa, petiscos exclusivos, café da manhã especial e vinhos finos para degustação no local. Escolha o menu abaixo.
          </p>
        </div>

        {/* Menu Switcher Tabs */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '40px',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          <button 
            onClick={() => setActiveTab('food')}
            className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '12px 24px', 
              fontSize: '13px', 
              fontWeight: '600',
              maxWidth: '100%',
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.3'
            }}
          >
            <i className="fa-solid fa-utensils" style={{ marginRight: '8px' }}></i> Cardápio À La Carte
          </button>
          <button 
            onClick={() => setActiveTab('breakfast')}
            className={`btn ${activeTab === 'breakfast' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '12px 24px', 
              fontSize: '13px', 
              fontWeight: '600',
              maxWidth: '100%',
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.3'
            }}
          >
            <i className="fa-solid fa-mug-hot" style={{ marginRight: '8px' }}></i> Café da Manhã
          </button>
          <button 
            onClick={() => setActiveTab('drinks')}
            className={`btn ${activeTab === 'drinks' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '12px 24px', 
              fontSize: '13px', 
              fontWeight: '600',
              maxWidth: '100%',
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.3'
            }}
          >
            <i className="fa-solid fa-wine-glass" style={{ marginRight: '8px' }}></i> Carta de Bebidas & Adega
          </button>
        </div>

        {/* Menu Content Display */}
        <div className="glass cardapio-glass-container" style={{ 
          padding: '20px', 
          borderRadius: 'var(--radius-lg)', 
          textAlign: 'center',
          overflow: 'hidden',
          marginBottom: '40px'
        }}>
          {activeTab === 'food' && (
            <div>
              <div className="cardapio-img-box" style={{ 
                position: 'relative', 
                width: '100%', 
                backgroundColor: '#15181c', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src={images.food} 
                  alt="Cardápio À La Carte Antenor e Filhos" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'breakfast' && (
            <div>
              <div className="cardapio-img-box" style={{ 
                position: 'relative', 
                width: '100%', 
                backgroundColor: '#15181c', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src={images.breakfast} 
                  alt="Cardápio de Café da Manhã Antenor e Filhos" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'drinks' && (
            <div>
              <div className="cardapio-img-box" style={{ 
                position: 'relative', 
                width: '100%', 
                backgroundColor: '#15181c', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src={images.drinks} 
                  alt="Carta de Bebidas e Adega Antenor e Filhos" 
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Call to Action for Reservations */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h4 style={{ color: 'white', fontSize: '18px', marginBottom: '15px' }}>Deseja reservar uma mesa?</h4>
          <p style={{ fontSize: '14px', marginBottom: '25px', color: 'var(--text-secondary)' }}>
            Faça sua reserva pelo WhatsApp e garanta sua mesa no restaurante mais aconchegante de Itaipava.
          </p>
          <a 
            href="https://wa.me/552422221482?text=Olá,%20gostaria%20de%20reservar%20uma%20mesa%20no%20Restaurante!" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ padding: '14px 40px', fontSize: '15px' }}
          >
            <i className="fa-brands fa-whatsapp" style={{ marginRight: '8px' }}></i> Reservar Mesa via WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
