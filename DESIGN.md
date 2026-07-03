---
name: Antenor e Filhos
description: Premium Boutique de Carnes & Adega
colors:
  primary: "#ab9070"
  primary-light: "#d7b994"
  accent: "#e3cfaf"
  neutral-bg: "#000000"
  neutral-card: "#090a0d"
  neutral-text: "#ffffff"
  neutral-muted: "#8a94a6"
  neutral-border: "#1c1f26"
typography:
  display:
    fontFamily: "FuturaLT, Inter, sans-serif"
    fontWeight: 300
    letterSpacing: "var(--ls-wide)"
    lineHeight: "var(--lh-tight)"
    fontSize: "var(--text-display)"
  title:
    fontFamily: "FuturaLT, Inter, sans-serif"
    fontWeight: 600
    letterSpacing: "var(--ls-wide)"
    lineHeight: "var(--lh-snug)"
  body:
    fontFamily: "FuturaLT, Inter, sans-serif"
    fontWeight: 400
    fontSize: "var(--text-base)"
    lineHeight: "var(--lh-normal)"
    letterSpacing: "var(--ls-normal)"
  script:
    fontFamily: "Blesing, cursive, serif"
    fontWeight: 400
    lineHeight: 1.1
typeScale:
  xs: "0.75rem"       # 12px — captions, badges
  sm: "0.875rem"      # 14px — metadata, labels, nav
  base: "1rem"        # 16px — body copy
  lg: "1.25rem"       # 20px — lead, card titles
  xl: "1.5625rem"     # 25px — sub-headings
  2xl: "1.953rem"     # 31px — section headings (h2)
  3xl: "2.441rem"     # 39px — page headings (h1)
  display: "clamp(2.441rem, 5vw + 1rem, 4.25rem)"    # fluid hero h1
  display-sm: "clamp(1.953rem, 3.5vw + 0.5rem, 2.8rem)" # fluid section h2
lineHeights:
  tight: 1.1    # display headings
  snug: 1.25    # card titles
  normal: 1.65  # body (dark-bg compensation +0.05)
  relaxed: 1.8  # long-form passages
letterSpacing:
  tight: "-0.02em"  # large display
  normal: "0.01em"  # body dark-bg
  wide: "0.05em"    # headings, uppercase
  wider: "0.10em"   # buttons, eyebrow
rounded:
  sm: "0px"
  md: "0px"
  lg: "0px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "8px 35px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 35px"
---

# Design System: Antenor e Filhos

## 1. Overview

**Creative North Star: "The Elegant Cellar"**

O design busca reproduzir o ambiente de uma adega de alto luxo: intimista, focada em vinhos e contrastes suaves e luxuosos. Com a estética fundamentada em tons escuros e refinados (Black & Gold), a interface flutua sobre fundos sóbrios utilizando um forte componente de *glassmorphism* (desfoque e transparência) para criar uma sensação de profundidade etérea, mas sem perder o peso da marca. O sistema explicitamente rejeita designs 'tech' frios, corporativos ou interfaces no estilo SaaS genérico.

**Key Characteristics:**
- **Atmosfera de Adega**: Predominância do preto total e cinzas profundos para o fundo, com texturas sutis que emulam um ambiente à meia-luz.
- **Glassmorphism Refinado**: Uso extensivo de backdrops desfocados (`blur(24px)`) para elementos flutuantes (navbar, cards de produtos, floating carts).
- **Flutuante e Elegante**: A filosofia interativa evita bordas duras demais nos blocos e prefere sombras difusas para manter a leveza do luxo.

## 2. Colors

O tom vibrante, moderno e despojado de mostarda atua como âncora dourada sobre um fundo de ausência de luz (preto puro).

### Primary
- **Mostarda Dourado** (#ab9070): O tom de destaque principal. Usado em botões primários, ícones ativos, títulos em destaque e bordas sutis. É vibrante, moderno e despojado.
- **Mostarda Claro** (#d7b994): Usado no estado *hover* dos botões, textos secundários e detalhes que precisam brilhar mais contra o fundo escuro.

### Secondary
- **Bege Suave (Accent)** (#e3cfaf): Um toque leve e luxuoso para complementos finos, linhas divisórias e detalhes tipográficos bem específicos.

### Neutral
- **Preto Absoluto** (#000000): O fundo mestre do sistema.
- **Carvão Noturno** (#090a0d): Fundo dos cards e contêineres opacos.
- **Branco Puro** (#ffffff): Textos principais.
- **Cinza Neblina** (#8a94a6): Textos secundários, descrições longas e metadados.
- **Borda Sombria** (#1c1f26): Separadores e delineamentos sutis entre seções.

**The Contrast Rule.** O Mostarda Dourado é a única fonte de cor viva no design. Ele nunca deve ser usado em grandes blocos sólidos que não sejam botões, e sim focado em guiar o olho (tipografia fina, linhas, ícones).

## 3. Typography

**Display Font:** FuturaLT, Inter, sans-serif
**Body Font:** FuturaLT, Inter, sans-serif
**Script Font:** Blesing, cursive

**Character:** A tipografia alterna o minimalismo muito leve (Light, 300) do FuturaLT para grandes títulos com muito espaçamento (0.05em), emulando as capas de cardápios luxuosos, misturada ao contraste moderno e funcional do mesmo FuturaLT em pesos maiores (600) para preços e destaques. O uso pontual da fonte `Blesing` traz o toque humano de assinatura.

### Hierarchy
- **Display** (300, uppercase, 0.05em): Utilizado em títulos (H1-H6) que marcam seções importantes do site.
- **Title** (600, normal case): Focado no nome do produto, para legibilidade limpa e direta.
- **Body** (400): Textos gerais, descrições de produtos.
- **Script** (400, cursive): Letras decorativas, assinaturas, elementos de storytelling visual.

**The Uppercase Spacing Rule.** Qualquer título ou botão em `uppercase` deve usar espaçamento de letras `letter-spacing: 0.05em` ou `0.1em`. Textos maiúsculos sem respiro matam o ar premium.

## 4. Elevation

O sistema utiliza fortemente o hibridismo entre tonal layering e glassmorphism flutuante. As superfícies principais (cards) possuem gradientes muito sutis (135deg) para quebrar o chapado, mas a verdadeira elevação se dá pelas sombras difusas e o desfoque de fundo.

### Shadow Vocabulary
- **Glow Ambiental (sm)** (`0 2px 4px rgba(0,0,0,0.3)`): Para dar sutileza tátil a botões menores ou badges.
- **Flutuação de Card (lg)** (`0 8px 32px rgba(0,0,0,0.25)`): A sombra principal que desconecta os cards do fundo e lhes dá vida, frequentemente combinada com `backdrop-filter: blur(20px)`.

**The Glass Floor Rule.** Elementos que sobrepõem conteúdo (como Navbar e Floating Cart) devem usar fundo altamente transparente combinado com desfoque intenso (`blur(24px)`), para garantir que a interface flutue elegantemente sem bloquear a visão da loja.

## 5. Components

Os componentes são flutuantes, desenhados para ter um recorte limpo de forma (frequentemente usando raio de 0px `square` em botões originais, ou raios altos em barras flutuantes) combinados com o peso luxuoso.

### Buttons
- **Shape:** Retos (0px).
- **Primary:** Fundo Mostarda (#ab9070), texto Preto. Padding 8px 35px. Uppercase, espaçado.
- **Hover / Focus:** Transição suave para Mostarda Claro (#d7b994) com leve movimento no eixo Y (`translateY(-1px)`).
- **Secondary / Ghost:** Fundo transparente, borda (#ab9070), texto na cor primária.

### Cards (Product)
- **Corner Style:** Retos ou sutilmente arredondados, dependendo do refinamento (0px ou raio leve, seguindo a base de CSS global).
- **Background:** Gradiente escuro translúcido com `blur(20px)`.
- **Shadow Strategy:** Flutuação de Card (lg).
- **Hover:** O card sobe 6px (`translateY(-6px)`) e a sombra amplifica, dando a sensação de que foi "pego" da prateleira da adega.

### Floating Cart / Navbar
- **Style:** Painéis arredondados (no cart) ou de ponta a ponta (navbar) com glassmorphism, delineamento de 1px em rgba(171,144,112, 0.12).

## 6. Do's and Don'ts

### Do:
- **Do** usar o `backdrop-filter: blur(24px)` para elementos fixos que se sobrepõem ao conteúdo.
- **Do** manter grandes respiros (paddings enormes) entre seções, pois o espaço em branco (ou preto, neste caso) é a principal assinatura de luxo.
- **Do** usar letras maiúsculas finas (300 weight) com `letter-spacing: 0.05em` para seções.

### Don't:
- **Don't** criar interfaces no estilo SaaS genérico, frias ou corporativas.
- **Don't** usar o Mostarda Dourado (#ab9070) como plano de fundo de seções inteiras. Ele é uma cor de acento e interação.
- **Don't** arredondar botões primários (manter 0px), se essa for a linguagem original para passar peso (exceto em interfaces que demandem botões redondos como o cart badge).
- **Don't** permitir que a tipografia se torne densa demais; use descrições curtas e sucintas nos cards de produto.
