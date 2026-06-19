'use client';

import { useState, useEffect } from 'react';

export default function CardapioPage() {
  const [activeTab, setActiveTab] = useState('food'); // 'food' or 'drinks'

  useEffect(() => {
    document.title = "Nosso Cardápio À La Carte e Carta de Vinhos | Antenor e Filhos";
  }, []);

  return (
    <div style={{ minHeight: '80vh', padding: '60px 0' }}>
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
            Nossas carnes preparadas na brasa, petiscos exclusivos e vinhos finos para degustação no local. Escolha o menu abaixo.
          </p>
        </div>

        {/* Menu Switcher Tabs */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '15px', 
          marginBottom: '45px' 
        }}>
          <button 
            onClick={() => setActiveTab('food')}
            className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 30px', fontSize: '14px', fontWeight: '600' }}
          >
            <i className="fa-solid fa-utensils" style={{ marginRight: '8px' }}></i> Cardápio À La Carte
          </button>
          <button 
            onClick={() => setActiveTab('drinks')}
            className={`btn ${activeTab === 'drinks' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 30px', fontSize: '14px', fontWeight: '600' }}
          >
            <i className="fa-solid fa-wine-glass" style={{ marginRight: '8px' }}></i> Carta de Bebidas & Adega
          </button>
        </div>

        {/* Menu Content Display */}
        <div className="glass" style={{ 
          padding: '20px', 
          borderRadius: 'var(--radius-lg)', 
          textAlign: 'center',
          overflow: 'hidden',
          marginBottom: '40px'
        }}>
          {activeTab === 'food' ? (
            <div>
              <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '18px' }}>Cardápio de Alimentação À La Carte</h3>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                backgroundColor: '#15181c', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src="https://antenorefilhos.com.br/cardapio/wa_images/alacarte.jpg" 
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
          ) : (
            <div>
              <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '18px' }}>Carta de Bebidas e Vinhos</h3>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                backgroundColor: '#15181c', 
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <img 
                  src="https://antenorefilhos.com.br/cardapio/wa_images/bebidas.jpg" 
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
            href="https://wa.me/5524988650462?text=Olá,%20gostaria%20de%20reservar%20uma%20mesa%20no%20Restaurante!" 
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
