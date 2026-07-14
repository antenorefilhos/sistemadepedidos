---
name: Antenor e Filhos - Impeccable Design System (GSAP Edition)
description: Premium Boutique de Carnes & Adega (Tailwind + GSAP Parallax Architecture)
colors:
  charcoal: "#232122"       # Fundo Escuro Mestre
  gold: "#D2BB8A"           # Interações, Botões e Destaques
  wine: "#5D082A"           # Badges, Descontos e Destaques Secundários
  white: "#FFFFFF"          # Textos
  black: "#000000"          # Alto Contraste (Opcional)
typography:
  fonts:
    serif: "'Playfair Display', serif"  # Headings, Títulos de Destaque, Storytelling
    sans: "'Inter', sans-serif"         # UI, Menus, Descrições Técnicas
spacing:
  container-px: "1.5rem"      # Mobile padding
  section-py: "8rem"          # Grandes respiros verticais entre seções (Luxo)
---

# Design System: Antenor e Filhos (Impeccable Standard)

## 1. Filosofia: "Absurd Storytelling & Top-Tier E-commerce"
A estética principal agora usa as CORES OFICIAIS da marca extraídas do manual de identidade. 

O site é dividido em dois propósitos principais:
1. **A Home (Storytelling Absurdo):** Focada inteiramente em narrativa. O layout é baseado em Seções de Tela Cheia (`h-screen`), governadas pelo motor de animação `GSAP` e `ScrollTrigger`. Efeitos de parallax intensos dominam a página inicial, onde imagens flutuam independentemente do texto.
2. **O E-commerce (Top-Tier Storefronts):** Focado em conversão limpa. As páginas de produtos e categorias abandonam as distrações animadas intensas em favor de um layout altamente funcional, com foco em usabilidade mobile, imagens grandes e botões de compra fixos.

> **O Padrão Impeccable:** 
> Tudo é construído **puramente em HTML Semântico + Tailwind CSS v4 nativo + GSAP**. 
> Zero uso de bibliotecas de componentes prontos que "sujem" o DOM com classes aleatórias.

---

## 2. A Paleta de Cores (Tailwind `@theme`)

* **Background (`--color-charcoal`: `#232122`)**: A cor de fundo absoluta de todas as páginas. Muito mais rica e macia que um preto puro.
* **Gold (`--color-gold`: `#D2BB8A`)**: A cor principal da marca. Usada para Botões de Ação Primária, Links em hover, e finas linhas decorativas.
* **Wine (`--color-wine`: `#5D082A`)**: Excelente para categorias de adega e badges "Novo" ou "Promoção".
* **Textos (`--color-foreground`: `#ffffff`)**: Branco puro sobre o carvão para máxima legibilidade e alto contraste.

---

## 3. Tipografia (The Dual Font Rule)

1. **Inter (Sans)**: Utilizada nas interfaces funcionais. Botões, menus de navegação, descrições técnicas, textos de corpo (Body).
   - *Regra Uppercase*: Sempre que for usada em letras maiúsculas (`uppercase`), OBRIGATORIAMENTE deve ser acompanhada de `tracking-wider` ou `tracking-widest`.
2. **Playfair Display (Serif)**: Utilizada estritamente para o "Glamour" e "Storytelling".
   - Textos de Parallax na Home.
   - Nomes de produtos na Storefront.

---

## 4. Sistema de Componentes 

Todas as classes foram exportadas para o `globals.css` no `@layer components`. Não injete classes gigantes repetitivas no HTML; use os utilitários semânticos.

### Botões
- `<button className="btn-gold">COMPRAR AGORA</button>`
- `<button className="btn-wine">VER ADEGA</button>`
- `<button className="btn-outline">SABER MAIS</button>`

### Glass Cards (Cards Translúcidos)
- `<div className="glass-panel rounded-2xl p-6">...</div>`

### Layout Global
- `<div className="container-app">...</div>` (Garante max-width e padding no mobile).

---

## 5. Diretrizes GSAP e Parallax

### Regras Ouro para Animação React/Next.js:
- **Sempre** utilize o hook oficial `@gsap/react` (`useGSAP()`) para envolver as animações. Isso evita vazamento de memória e garante que os *ScrollTriggers* sejam mortos quando o componente for desmontado.
- Animações pesadas devem ocorrer dentro de componentes `use client`.
- **Z-Index Layering:** Para um parallax eficaz, separe as camadas de imagem em divs com position `absolute` e diferentes `z-index`. 

### "100% Mobile First"
As animações GSAP não devem quebrar no celular. Teste primeiro a física do scroll na altura e largura de um smartphone (`100dvh`, `100vw`). O Desktop é apenas um palco mais largo para a mesma cena.
