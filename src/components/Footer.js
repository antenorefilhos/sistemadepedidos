'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const DAYS_ORDER = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DAY_LABELS = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

export default function Footer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Busca as configurações da API
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => {
        const companyData = json.find(item => item.key === 'company_data')?.value;
        if (companyData) {
          setData(companyData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar configurações no rodapé:', err);
        setLoading(false);
      });

    // Atualiza o tempo a cada minuto para o status de aberto/fechado em tempo real
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Helpers de formatação dos contatos
  const formatPhone = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const getCleanPhone = (phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    // Se não tiver código de país, adiciona 55 por padrão
    if (clean.length <= 11) {
      return `55${clean}`;
    }
    return clean;
  };

  // Verifica se está aberto agora e retorna o status detalhado
  const checkStatus = (weeklyHours) => {
    if (!weeklyHours) return { isOpen: false, text: 'Fechado', todayText: '' };

    const dayIndex = currentTime.getDay();
    const currentKey = DAYS_ORDER[dayIndex];
    const rules = weeklyHours[currentKey] || { open: '09:00', close: '19:00', closed: false };

    if (rules.closed) {
      return { isOpen: false, text: 'Fechado agora', todayText: 'Hoje: Fechado' };
    }

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const [openH, openM] = rules.open.split(':').map(Number);
    const [closeH, closeM] = rules.close.split(':').map(Number);
    const openTotalMinutes = openH * 60 + openM;
    const closeTotalMinutes = closeH * 60 + closeM;

    const isOpen = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;
    const statusText = isOpen ? 'Aberto agora' : 'Fechado agora';
    const todayText = `Hoje: ${rules.open} às ${rules.close}`;

    return { isOpen, text: statusText, todayText };
  };

  // Formata o resumo semanal agrupando dias com horários idênticos
  const formatWeeklySummary = (weeklyHours) => {
    if (!weeklyHours) return 'Horários indisponíveis';
    
    // Tratamento se for uma string (retrocompatibilidade)
    if (typeof weeklyHours === 'string') {
      return weeklyHours;
    }
    
    const weekOrder = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    let groups = [];
    let currentGroup = null;

    weekOrder.forEach(day => {
      const rules = weeklyHours[day] || { open: '09:00', close: '19:00', closed: false };
      const ruleStr = rules.closed ? 'Fechado' : `${rules.open} às ${rules.close}`;

      if (currentGroup && currentGroup.ruleStr === ruleStr) {
        currentGroup.days.push(day);
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { ruleStr, days: [day] };
      }
    });
    if (currentGroup) groups.push(currentGroup);

    return groups.map(g => {
      let daysText = '';
      if (g.days.length === 1) {
        daysText = DAY_LABELS[g.days[0]];
      } else if (g.days.length === 2) {
        daysText = `${DAY_LABELS[g.days[0]]} e ${DAY_LABELS[g.days[1]]}`;
      } else {
        daysText = `${DAY_LABELS[g.days[0]]} a ${DAY_LABELS[g.days[g.days.length - 1]]}`;
      }
      return `${daysText}: ${g.ruleStr}`;
    }).join(' | ');
  };

  // Fallbacks estáticos padrão se a chamada da API demorar ou falhar
  const defaultAddress = 'Estrada União Indústria, 12273 - Itaipava, Petrópolis - RJ';
  const defaultPhoneBoutique = '24988650462';
  const defaultPhoneRestaurante = '2422221482';
  const defaultInstagram = '@antenorefilhos';
  const defaultDelivery = 'Petrópolis, Itaipava, Nogueira, Corrêas...';

  // Extrai dados reais com fallbacks
  const addressBoutique = data?.address || defaultAddress;
  const phoneBoutique = data?.phone || defaultPhoneBoutique;
  const addressRestaurante = data?.restaurant_address || addressBoutique;
  const phoneRestaurante = data?.restaurant_phone || defaultPhoneRestaurante;
  const instagram = data?.instagram || defaultInstagram;
  const deliveryAreas = data?.delivery_areas || defaultDelivery;

  // Status Aberto/Fechado em tempo real
  const boutiqueStatus = checkStatus(data?.hours);
  const restaurantStatus = checkStatus(data?.restaurant_hours);

  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      padding: '60px 0 30px 0',
      color: 'var(--text-secondary)'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
      }}>
        {/* SOBRE */}
        <div>
          <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontFamily: 'var(--font-serif)', fontSize: '20px' }}>
            Antenor & Filhos
          </h3>
          <p style={{ fontSize: '14px', lineHeight: '1.7', marginBottom: '15px' }}>
            Desde sua fundação, trazendo cortes premium de gados selecionados, carnes exóticas e uma adega exclusiva de vinhos finos em Itaipava, Petrópolis.
          </p>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Entregas em:</span> {deliveryAreas}
          </div>
        </div>

        {/* FUNCIONAMENTO DINÂMICO */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Funcionamento
          </h4>
          
          {/* BOUTIQUE */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Boutique & Adega</span>
              
              {/* BADGE DINÂMICO DE STATUS */}
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: boutiqueStatus.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: boutiqueStatus.isOpen ? '#34d399' : '#f87171',
                border: boutiqueStatus.isOpen ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {boutiqueStatus.isOpen && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #10b981',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: '#10b981',
                      animation: 'ping 1.5s infinite',
                      opacity: 0.75
                    }}></span>
                  </span>
                )}
                {boutiqueStatus.text}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {loading ? 'Carregando horários...' : formatWeeklySummary(data?.hours)}
            </p>
            {data?.hours && !loading && (
              <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', display: 'block' }}>
                {boutiqueStatus.todayText}
              </span>
            )}
          </div>

          {/* RESTAURANTE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Restaurante & Bistrô</span>
              
              {/* BADGE DINÂMICO DE STATUS */}
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: restaurantStatus.isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: restaurantStatus.isOpen ? '#34d399' : '#f87171',
                border: restaurantStatus.isOpen ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                {restaurantStatus.isOpen && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #10b981',
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: '#10b981',
                      animation: 'ping 1.5s infinite',
                      opacity: 0.75
                    }}></span>
                  </span>
                )}
                {restaurantStatus.text}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {loading ? 'Carregando horários...' : formatWeeklySummary(data?.restaurant_hours)}
            </p>
            {data?.restaurant_hours && !loading && (
              <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', display: 'block' }}>
                {restaurantStatus.todayText}
              </span>
            )}
          </div>
        </div>

        {/* CONTATO DINÂMICO */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contato
          </h4>
          <p style={{ fontSize: '13px', marginBottom: '10px', lineHeight: '1.4' }}>
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> 
            {addressBoutique}
          </p>
          
          <p style={{ fontSize: '13px', marginBottom: '8px' }}>
            <b>Loja/Boutique:</b>{' '}
            <a 
              href={`https://wa.me/${getCleanPhone(phoneBoutique)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >
              <i className="fa-brands fa-whatsapp" style={{ color: 'var(--whatsapp)', marginRight: '3px' }}></i> 
              {formatPhone(phoneBoutique)}
            </a>
          </p>

          <p style={{ fontSize: '13px', marginBottom: '8px' }}>
            <b>Restaurante:</b>{' '}
            <a 
              href={`https://wa.me/${getCleanPhone(phoneRestaurante)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >
              <i className="fa-brands fa-whatsapp" style={{ color: 'var(--whatsapp)', marginRight: '3px' }}></i> 
              {formatPhone(phoneRestaurante)}
            </a>
          </p>
          
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> 
            loja@antenorefilhos.com.br
          </p>
          
          {instagram && (
            <p style={{ fontSize: '13px' }}>
              <a 
                href={`https://instagram.com/${instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}
              >
                <i className="fa-brands fa-instagram" style={{ marginRight: '6px' }}></i>
                {instagram}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="container" style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <p>&copy; {new Date().getFullYear()} Antenor e Filhos. Todos os direitos reservados.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/termos" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Termos de Uso</Link>
          <Link href="/privacidade" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
