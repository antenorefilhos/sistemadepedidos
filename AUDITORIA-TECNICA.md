# Relatório de Auditoria Técnica — Sistema Antenor & Filhos

**Escopo:** Sistema de Pedidos e E-commerce da Antenor & Filhos (Boutique de Carnes Nobres, Adega de Vinhos e Restaurante — Itaipava/RJ)
**Stack:** Next.js 16 (App Router) · React 19 · Supabase/PostgreSQL · Tailwind v4 + DaisyUI v5
**Data:** 21/07/2026

Auditoria completa: arquitetura, performance, segurança, UX/UI e camada de dados, cobrindo storefront público, painel admin, todas as API routes e configuração de infraestrutura. Achados verificados por leitura direta do código-fonte (arquivo:linha citados onde relevante).

---

## 🌟 1. Pontos Fortes

- **Stack moderna e bem escolhida**: Next.js 16 App Router + React 19 + Tailwind v4 (arquitetura CSS-first `@theme`) + DaisyUI v5 + Supabase/Postgres. Nenhuma dessas escolhas está datada ou é questionável para o porte do negócio.
- **Uso correto de Server Components onde importa mais**: `produtos/[slug]/page.js` e `receitas/[slug]/page.js` fazem fetch direto no servidor via `getSupabase()`, com `generateMetadata` dinâmico bem implementado (título, descrição, Open Graph a partir do produto/receita real).
- **`SellerReferralTracker`** usa `useSearchParams` corretamente isolado em `<Suspense fallback={null}>` — padrão certo para não bloquear SSR.
- **Pipeline de upload de imagem já otimizado**: conversão automática para WebP via `sharp` no backend, com resize por tipo (`800px` produto vs `1400px` genérico) — isso compensa parcialmente o `images.unoptimized: true`.
- **RLS parcialmente implementado** nas tabelas centrais do domínio de vendas (`products`, `orders`, `order_items`, `sellers`, `categories`) — a base do modelo de segurança existe, só não está completa.
- **Painel admin**: depois do trabalho desta sessão, hoje tem um kit de UI compartilhado (`Modal`, `Toast`, `ConfirmDialog`, `StatusBadge`, `Tag`, `StatCard`, `DataTable`, `ImageUploadField`), autenticação/fetch centralizados (`adminFetch`), tipografia unificada, nenhum arquivo com mais de ~530 linhas, e dois bugs de negócio reais corrigidos (vocabulário de status de pedido divergente do schema real; texto branco ilegível sobre fundo claro no Biolinks). Isso não existia há algumas horas — é a área mais saudável do projeto hoje.
- **JSON-LD na home** (`FoodEstablishment` com endereço, geo, horário) — presente e correto, só não replicado em outras páginas (ver abaixo).

---

## ⚠️ 2. Ajustes Imediatos (Alta Prioridade)

Ordenado por severidade real, não por facilidade de correção.

1. **Senha de administrador real, hardcoded como fallback, commitada no histórico do git.** A string `'Aef@1945*'` aparece idêntica em `src/app/api/admin/{customers,migrate,orders,reviews}/route.js:9` e `src/app/api/admin/upload/route.js:96`. Não é uma senha de exemplo genérica (`antenor123`) — o padrão sugere ser a senha real de produção. Se `ADMIN_PASSWORD` faltar em qualquer ambiente (preview do Vercel, novo deploy, erro de configuração), **o painel inteiro fica acessível com essa senha pública no código-fonte**. Precisa ser trocada imediatamente na Vercel, e o fallback removido do código (não só trocado por outro valor — eliminado, forçando falha explícita se a env var faltar). Como o repositório está no GitHub, essa senha deve ser considerada **comprometida** e trocada de qualquer forma, independente da correção de código.

2. **Rota de upload sem autenticação no POST.** `src/app/api/admin/upload/route.js` — o handler `POST` (linhas 6-89) não verifica senha alguma. Qualquer visitante anônimo pode fazer upload de arquivos para o bucket público `imagens` do Supabase Storage, sem limite de tamanho ou whitelist de tipo MIME antes do `Buffer.from(await file.arrayBuffer())`. Isso é abuso de armazenamento/custo na certa, e potencial vetor de hospedagem de conteúdo malicioso sob o domínio da loja.

3. **Checkout confia cegamente no preço enviado pelo cliente.** `src/app/api/orders/route.js:69-76` grava `price: item.price` direto do payload JSON, sem nenhuma consulta a `products.preco` para validar. Via DevTools, qualquer visitante pode alterar o preço (ou quantidade) antes do POST. O e-mail de notificação e a mensagem de WhatsApp usam esse mesmo valor adulterado. Hoje isso é mitigado *operacionalmente* (o vendedor confirma manualmente por WhatsApp), mas não tecnicamente — o pedido gravado no banco/admin já está errado antes dessa confirmação humana.

4. **Anon key do Supabase de produção hardcoded no bundle client, contornando toda a autenticação admin.** `src/app/links/BiolinkView.js:19-20,104-105` tem fallback literal com a URL e a anon key JWT completas do Supabase, e faz `fetch`/`PATCH` **direto** em `${supabaseUrl}/rest/v1/biolinks...`, sem passar pelas rotas `/api/admin/biolinks*` nem pela checagem de senha. A segurança dessas tabelas depende inteiramente de RLS estar habilitado — e não há evidência disso em nenhum script SQL fornecido para `biolinks`/`biolink_blocks`. Na prática, qualquer pessoa com essa chave (visível no bundle JS público) pode ler/escrever nessas tabelas diretamente.

5. **RLS ausente ou incompleto em tabelas com dado sensível ou gravação pública.** Confirmado nos scripts SQL fornecidos:
   - `app_settings` (`db_settings.sql`) — tabela criada sem RLS habilitado.
   - `customer_notes` — CRM interno de clientes, sem política em nenhum script.
   - `product_reviews` — sem política.
   - `biolinks`/`biolink_blocks` — sem política (agravado pelo item 4).
   - `supabase_recipes.sql:25-29` cria uma política `FOR ALL USING (true) WITH CHECK (true)` que na prática libera INSERT/UPDATE/DELETE para qualquer requisição, apesar do comentário sugerir restrição a admin.

6. **Sincronização com o ERP Solidcon trafega em HTTP puro, sem TLS.** `src/app/api/sync/prices/route.js` e `src/app/api/admin/solidcon/route.js` chamam `http://45.239.193.56:5001/api/Produto/GetProdutos` — IP fixo, sem HTTPS. Dados de preço/estoque trafegam em texto claro, suscetível a interceptação/adulteração na rede.

7. **Senha/token passados via query string em vários pontos**, ficando expostos em logs de servidor, proxies, CDN e no header `Referer`: `server.js:51` (mesmo sendo código morto, documenta o padrão), `src/app/api/admin/solidcon/route.js:9` aceita senha via `?auth=`, e o front-end do admin (`sessionStorage` + `?auth=` em toda chamada) generaliza esse padrão em ~20 rotas. Migrar para header `Authorization` é obrigatório mesmo sem trocar o modelo de senha única.

8. **`.git` do repositório com 456 MB, sendo 85% (13.104 arquivos) uma aplicação PHP de terceiros (`bio-links/`) com `vendor/` do Composer inteiro commitado** — SDKs completos de AWS, Stripe, Laravel, mais dumps SQL. O `.gitignore` tenta ignorar `bio-links/vendor/`, mas os arquivos já estavam commitados antes da regra existir, então continuam rastreados. Some a isso bancos SQLite binários (`db/catalog.db`), XMLs de export, scripts de uso único e um `test-tailwind.css` de 475 KB — tudo isso infla o clone/deploy sem necessidade.

9. **`npm run lint` está quebrado** — falta o pacote `typescript` como dependência (necessário transitivamente por `@typescript-eslint`, usado pelo `eslint-config-next`). Resultado prático: **nenhum lint roda hoje**, nem localmente nem em CI se houver. Isso permite que os problemas acima (e outros) passem despercebidos indefinidamente.

10. **`server.js` é código morto que descreve uma sincronização automática que não roda.** Nenhum script npm o chama (`dev`/`build`/`start` usam os binários nativos do Next). Um dev futuro lendo o comentário "sincronização a cada 6 horas" vai assumir que ela funciona em produção — ela não roda. Remover o arquivo (a sincronização real já existe via `/api/cron/sync`, presumivelmente chamada por cron externo).

11. **Filtro de busca de produtos vulnerável a injeção de sintaxe PostgREST.** `src/app/api/products/route.js:31` interpola `search` cru dentro de `.or(\`title.ilike.%${search}%,...\`)`. Caracteres como vírgula e parênteses têm significado especial na sintaxe de filtro do PostgREST — um `search` malicioso pode manipular a condição da query. Precisa de escaping/allowlist de caracteres antes de interpolar.

---

## 🛠️ 3. Melhorias de Arquitetura & Código (Média Prioridade)

### Autenticação/autorização
- A verificação de senha admin (`getRole`/`verifyAdmin`) está reimplementada de forma quase idêntica em ~17 arquivos de rota diferentes, cada um com pequenas variações não documentadas (com/sem fallback hardcoded, aceita manager ou só admin). Centralizar em `src/lib/auth.js` (uma função, importada por todas as rotas) eliminaria a inconsistência que já causou o bug do item 2.
- Modelo de senha única compartilhada (sem sessão real, sem expiração, sem log de quem fez o quê) é frágil para uma equipe com múltiplos vendedores/administradores. Migrar para autenticação real (Supabase Auth, NextAuth) com usuários individuais é o próximo passo natural, não só por segurança mas por rastreabilidade operacional.

### Data fetching / cache
- **Zero ISR/SSG em qualquer rota pública** — `force-dynamic` está espalhado em todas as API routes e em `receitas/page.js`/`receitas/[slug]/page.js`. Catálogo, categorias, receitas e configurações de horário mudam pouco; são candidatos naturais a `revalidate` com *on-demand revalidation* (via webhook do admin ao salvar) em vez de forçar renderização dinâmica a cada request.
- `BoutiqueClient.js` e `AdegaClient.js` são Client Components que fazem fetch via `useEffect` para `/api/products` (payload completo, sem usar o filtro `?type=` que a própria API já suporta) quando poderiam ser Server Components buscando direto do Supabase — como já é feito corretamente em `produtos/[slug]/page.js`. Isso eliminaria o spinner de carregamento inicial que hoje aparece em toda visita a essas duas páginas centrais do site.
- `ProductDetails.js` busca reviews via `useEffect` (waterfall client-side) quando o Server Component pai já poderia buscar em paralelo com o produto.

### Duplicação de lógica (storefront)
- Formatação de preço (`toLocaleString('pt-BR', {...})`) reimplementada em pelo menos 6 arquivos — não existe um `formatPrice()` compartilhado (o admin já tem `formatCurrencyBRL`; vale mover para um lib comum a admin+storefront).
- Lógica de bandeira de país do vinho (`COUNTRY_FLAG_MAP`) copiada literalmente entre `AdegaClient.js` e `ProductDetails.js`.
- Parsing de pontuação de vinho (regex `/([a-zA-Z\s]+)(\d+)/`) duplicado 3 vezes, inclusive duas vezes no mesmo arquivo.
- Gerenciamento de carrinho via `localStorage` (chave CSV de IDs repetidos, sem hook `useCart()`) reimplementado com pequenas variações em 4 arquivos — `Header.js` ainda faz polling de 1500ms como fallback redundante ao evento customizado `cart_changed`, rodando indefinidamente em toda página.
- "Card de produto" (grid com imagem/badges/preço/botão) é JSX inline duplicado em 3 lugares em vez de um componente `<ProductCard />`.

### API/backend
- Sincronização com o ERP Solidcon duplicada quase byte-a-byte entre `api/sync/prices` e `api/admin/solidcon` (mesmas regras de negócio, dois lugares para manter em sincronia).
- N+1 sequencial em `api/sync/route.js` (1 SELECT + 1 UPDATE por produto, sem batch) e em `api/cron/sync/route.js` (1 UPDATE por produto, totalmente serial) — vira gargalo real conforme o catálogo cresce.
- Nenhuma paginação em `/api/products`, `/api/admin/orders`, `/api/admin/customers` — tabelas inteiras carregadas a cada request.
- Sem índices confirmados em `products.sku`, `products.status`, `orders.customer_whatsapp` no schema Postgres atual (o legado SQLite tinha; não há garantia de que migraram).
- Mensagens de erro vazando `error.message` do Postgres direto ao client em ~10 rotas (`settings`, `recipes`, `migrate`, `import-catalog`, `upload`) — troque por mensagem genérica + log server-side.

### Frontend geral
- `HomeClient.js` (GSAP + parallax, ~166 linhas) não é importado por nenhuma rota — código morto que ainda carrega a dependência GSAP inteira no dependency tree.
- Nenhum uso de `prefers-reduced-motion` em lugar nenhum do código (zero ocorrências).
- `InteractiveIngredients.js` manipula DOM imperativamente dentro de `useEffect` em vez de `useState` — funciona, mas foge do modelo declarativo do React e não é acessível (ver seção UX).
- `globals.css` com 1.747 linhas e 93 cores hex hardcoded fora do sistema de tokens `@theme` (muitas delas duplicando valores que já têm token, ex. `#ab9070` repetido em vez de `var(--color-primary)`).
- Fontes customizadas (`FuturaLT`) carregadas via `@font-face` apontando para o domínio WordPress legado (`antenorefilhos.com.br/font/...`) em vez de hospedadas em `/public/fonts` — dependência de rede cross-origin desnecessária para um asset estático.

---

## 🎨 4. Evolução de UX/UI & Experiência Mobile

- **Sanitização de HTML ausente end-to-end**: `title`/`description` de produtos e `description`/`instructions` de receitas são gravados sem sanitização e renderizados via `dangerouslySetInnerHTML` em pelo menos 8 pontos do storefront (`BoutiqueClient`, `AdegaClient`, `ProductDetails`, `receitas/[slug]`). Combinado com a auth fraca do admin (itens 1-2), a cadeia completa senha fraca → gravação sem sanitização → XSS armazenado servido a todo visitante é real, não teórica. Isso é tanto segurança quanto UX (um HTML malformado vindo do banco pode quebrar o layout da página inteira).
- **Checklist de ingredientes não é acessível de fato**: não usa `<input type="checkbox">`/`role="checkbox"`, não tem `aria-checked`, não é operável por teclado (o `<li>` não é focável). Um recurso pensado para ser o diferencial de UX da página de receita hoje exclui usuários de teclado/leitor de tela.
- **SEO estruturado incompleto**: só a home tem JSON-LD. Produto (que já tem preço/nome estruturados) merece `Product`/`Offer` schema; receita (que já tem `prep_time`/`servings`/`difficulty` estruturados) merece `Recipe` schema — ambos aumentam elegibilidade a rich snippets no Google sem custo de desenvolvimento alto. Não há `sitemap.xml` nem `robots.txt` gerados em lugar nenhum.
- **`cardapio/page.js` define o título via `document.title` no client** em vez de `generateMetadata` — o `<title>` real nunca aparece no HTML servido a crawlers/compartilhamento social.
- **Mobile**: styling do storefront é majoritariamente inline (`style={{...}}`) com `clamp()`/`flexWrap` em vez de breakpoints Tailwind — funciona, mas é mais difícil de auditar/ajustar por tela do que classes utilitárias, e mistura convenções com o restante do projeto.
- **Imagens fora do fluxo de produto sem otimização alguma**: fotos do cardápio (potencialmente as maiores do site) e logo carregados via `<img>` cru, sem `loading="lazy"`, sem `width`/`height` — risco de CLS e LCP ruim justamente numa página (cardápio) que é provavelmente bastante acessada via QR code na mesa/vitrine.
- **Consistência (extensão do trabalho já feito no admin)**: a mesma varredura de "um componente por padrão visual" que fizemos no admin (StatCard, Tag, StatusBadge) ainda não foi feita no storefront — o "card de produto" tem 3 implementações JSX distintas (Boutique, Adega, relacionados na página de produto), exatamente o tipo de inconsistência visual já caçada duas vezes no admin.

---

## 💡 5. Propostas de Inovação (Liberdade Total)

- **Fechar o loop de confiança do checkout**: hoje o pedido vira "real" só quando o vendedor confirma manualmente pelo WhatsApp. Um passo natural é a rota `/api/orders` revalidar preço/status do produto no servidor no momento do POST (rejeitando itens com produto `status: 'off'` ou preço divergente além de uma tolerância), e o admin sinalizar visualmente "preço divergente do catálogo" nos pedidos onde isso ocorreu no passado — dá ao vendedor um sinal de confiança em vez de conferência manual às cegas.
- **Substituir a sincronização ERP simulada por uma real, com Vercel Cron declarado em `vercel.json`** — hoje `api/cron/sync` é decorativo (números aleatórios) e a integração real (`api/sync/prices`) roda por um mecanismo que não está declarado em nenhum lugar do repositório (nem `vercel.json` nem `server.js` funcional). Vale formalizar isso como Cron Job nativo da Vercel, com HTTPS para o ERP.
- **Programa de fidelidade / histórico de compras do cliente**: a tabela de clientes agregados (já existente, usada em `CustomersManager`) é a base perfeita para uma área "Minha Conta" simples no storefront (login por WhatsApp + código, sem senha) mostrando pedidos anteriores e permitindo "repetir pedido" — reduz fricção para os clientes recorrentes que hoje já existem na base.
- **Zoom de produto com galeria multi-imagem**: hoje cada produto parece ter uma única `image_url`. Para carnes premium/vinhos, fotos adicionais (corte, selo de certificação, rótulo/contra-rótulo) aumentam confiança de compra — o schema já suporta extensão fácil via uma tabela `product_images`.
- **Notificação push real para o time de vendas** (Web Push API ou integração com WhatsApp Business API oficial) substituindo o polling de 30s + som do navegador — mais confiável (funciona com a aba fechada) e profissionaliza o "novo pedido chegou" além de depender de alguém estar com o admin aberto.
- **Rich snippets de Receita + Produto no Google** tem potencial real de tráfego orgânico gratuito para uma marca regional — receitas com carnes específicas do catálogo são a ponte natural entre conteúdo e venda (a página de receita já linka produtos relacionados).
- **Consolidar a "reforma de consistência" do admin para o storefront**: o mesmo processo aplicado ao admin (StatCard, Tag, StatusBadge, kit de UI) tem retorno real aplicado à Boutique/Adega — um `<ProductCard />`, `useCart()` e `formatPrice()` compartilhados eliminam a duplicação já documentada e dão folga para evoluir o design sem medo de quebrar 3 cópias divergentes.
- **Considerar separar `bio-links/` para um repositório próprio** (ou remover se não estiver mais em uso ativo) — isso sozinho reduziria o `.git` de 456 MB para uma fração disso, acelerando clone, CI e deploy.

---

## Recomendação de priorização

Dado o volume de achados, a sugestão prática é começar pelos itens **1, 2, 3 e 4** da seção "Ajustes Imediatos" (as duas senhas hardcoded, a rota de upload aberta e a anon key exposta), já que são os únicos com exposição de segurança real e ativa, antes de qualquer trabalho de arquitetura ou UX.
