'use client';

import { useEffect, useRef } from 'react';

export default function InteractiveIngredients({ html }) {
  const containerRef = useRef(null);

  // Parse do HTML para normalizar em formato de lista independente da estrutura original
  let parsedHtml = html;
  if (html) {
    // Caso 1: Já tem <li>, apenas envolve em <ul> se não tiver
    if (html.includes('<li')) {
      if (!html.includes('<ul') && !html.includes('<ol')) {
        parsedHtml = `<ul>${html}</ul>`;
      }
    }
    // Caso 2: Ingredientes separados por <br> (formato comum do editor)
    else if (html.includes('<br') || html.includes('<BR')) {
      const parts = html
        .split(/<br\s*\/?>/gi)
        .map(part => part.replace(/<\/?[^>]+(>|$)/g, "").trim())
        .filter(part => part.length > 0);
      parsedHtml = `<ul>${parts.map(part => `<li>${part}</li>`).join('')}</ul>`;
    }
    // Caso 3: Ingredientes em <div> ou <p> separados (formato do Supabase)
    else if (html.includes('<div') || html.includes('<p')) {
      const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
      if (tempDiv) {
        tempDiv.innerHTML = html;
        const elements = tempDiv.querySelectorAll('div, p');
        if (elements.length > 0) {
          const items = Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0);
          parsedHtml = `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        }
      } else {
        // Fallback para SSR: usa regex
        const items = html
          .replace(/<\/(div|p)>/gi, '\n')
          .replace(/<(div|p)[^>]*>/gi, '')
          .replace(/<\/?[^>]+(>|$)/g, '')
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        parsedHtml = `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;
    
    const lis = containerRef.current.querySelectorAll('li');
    lis.forEach(li => {
      // Evita duplicar o ícone se o effect rodar novamente
      if (li.querySelector('.ingredient-checkbox')) return;

      // Estilização do item da lista
      li.style.cursor = 'pointer';
      li.style.transition = 'all 0.2s ease';
      li.style.position = 'relative';
      li.style.paddingLeft = '32px';
      li.style.listStyleType = 'none';
      li.style.userSelect = 'none';
      li.style.marginBottom = '14px';
      li.style.lineHeight = '1.6';
      li.style.fontSize = '15px';
      
      // Cria o elemento do checkbox customizado
      const check = document.createElement('span');
      check.className = 'ingredient-checkbox';
      check.innerHTML = '<i class="fa-regular fa-square"></i>';
      check.style.position = 'absolute';
      check.style.left = '0';
      check.style.top = '3px';
      check.style.color = 'var(--primary)';
      check.style.fontSize = '16px';
      check.style.transition = 'color 0.2s ease';
      
      li.style.listStyle = 'none';
      li.prepend(check);

      const toggleCheck = (e) => {
        e.stopPropagation();
        const isChecked = li.getAttribute('data-checked') === 'true';
        if (isChecked) {
          li.setAttribute('data-checked', 'false');
          li.style.textDecoration = 'none';
          li.style.color = 'rgba(209, 213, 219, 1)';
          li.style.opacity = '1';
          check.innerHTML = '<i class="fa-regular fa-square"></i>';
          check.style.color = 'var(--primary)';
        } else {
          li.setAttribute('data-checked', 'true');
          li.style.textDecoration = 'line-through';
          li.style.color = 'rgba(156, 163, 175, 0.6)';
          li.style.opacity = '0.5';
          check.innerHTML = '<i class="fa-solid fa-square-check"></i>';
          check.style.color = '#25D366';
        }
      };

      li.addEventListener('click', toggleCheck);
    });
  }, [parsedHtml]);

  return (
    <div 
      ref={containerRef}
      className="max-w-none text-gray-300"
      style={{
        fontSize: '15px',
        lineHeight: '1.6'
      }}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}
