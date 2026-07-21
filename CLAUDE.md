# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (next dev)
npm run build    # build de produção
npm run start    # serve o build de produção (next start)
npm run lint     # eslint (eslint-config-next/core-web-vitals)
```

Não há suíte de testes configurada neste projeto. `server.js` é um servidor HTTP customizado (com um agendador `setInterval` de sincronização a cada 6h) que **não** é usado pelos scripts npm acima nem pela Vercel — é vestigial/alternativo. Em produção (Vercel serverless) a sincronização de preços roda via cron externo batendo em `/api/cron/sync`, não via `server.js`.

## Arquitetura

Next.js 16 (App Router) + React 19, com todo o código-fonte em `src/` (alias `@/*` → `src/*`). Ver AGENTS.md: esta versão do Next.js tem breaking changes em relação ao conhecimento de treinamento — antes de mexer em rotas/config, checar `node_modules/next/dist/docs/`.

### Duas camadas de banco de dados
- `src/lib/pgDb.js` (`getSupabase()`) — cliente Supabase/PostgreSQL, é a fonte de dados **real** de produção (produtos, orçamentos, clientes, receitas, avaliações, vendedores).
- `src/lib/db.js` (`getDb()`) — SQLite local via `@libsql/client` (`db/catalog.db`), usado apenas por scripts legados de importação/migração de catálogo (`migrate-tables.js`, `scripts/*.py`). Não usar para features novas do app.

### Rotas principais (`src/app/`)
- `/` (institucional/home com storytelling GSAP), `/boutique`, `/distribuidora`, `/cardapio`, `/adega`, `/produtos/[slug]`, `/receitas/[slug]`, `/carrinho`, `/entregas`, `/obrigado`, `/links/[slug]` (bio-links).
- `/admin` — painel gerencial (produtos, pedidos/orçamentos, clientes, vendedores, categorias, receitas, avaliações, telemetria, configurações).
- `src/app/api/` — API routes espelhando os recursos acima, mais `api/admin/*` (equivalentes autenticados para o painel), `api/cron/sync` e `api/sync/prices` (sincronização de preços ERP) e `api/telemetry/*`.
- Rotas de dados usam `export const dynamic = 'force-dynamic'` por padrão (ver `architecture/deploy-e-hospedagem.md` na vault Obsidian).

### Autenticação do admin
Simples comparação de senha por variável de ambiente (`ADMIN_PASSWORD` / `MANAGER_PASSWORD`) em `src/app/api/admin/auth/route.js`, retornando `role: 'admin' | 'manager'`. Não há sessão/JWT — sem middleware de auth (`src/middleware.js` não existe); a proteção das rotas `/admin/api/*` é feita rota a rota comparando a senha enviada.

### Integração ERP
`src/app/api/cron/sync/route.js` e `api/sync/prices` hoje **simulam** a sincronização de preços (variação aleatória ±2%) — ainda não há integração real SOAP/REST com o ERP Solidcon; não assumir que os preços vêm de um sistema externo real ao debugar esse fluxo.

### Subprojeto `bio-links/`
Aplicação PHP vendorizada (self-hosted bio-link/vCard tool, ecossistema AltumCode) servida pela rota `/links/[slug]`. É um sistema separado do Next.js — mudanças ali seguem convenções PHP próprias, não as deste app.

### Variáveis de ambiente (`.env.local`, não commitado)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`, `MANAGER_PASSWORD`, `SYNC_TOKEN`, `GEMINI_API_KEY`, `FTP_HOST`/`FTP_USER`/`FTP_PASSWORD`/`FTP_PORT`/`FTP_REMOTE_DIR`/`FTP_PUBLIC_URL` (upload de imagens via FTP em paralelo ao Supabase Storage).

### Design system
Ver `DESIGN.md` (paleta charcoal/gold/wine, tipografia Playfair Display + Inter, animações GSAP/ScrollTrigger via `@gsap/react`) e `PRODUCT.md` (persona, marca "rústico de luxo"). Documentação arquitetural mais ampla e o histórico de versionamento vivem na vault Obsidian referenciada em AGENTS.md.
