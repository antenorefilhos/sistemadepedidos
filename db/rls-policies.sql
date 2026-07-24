-- ============================================================================
-- Antenor & Filhos — Habilitação de Row Level Security (RLS)
-- ============================================================================
-- Corrige o incidente crítico "Table publicly accessible / rls_disabled_in_public".
--
-- COMO RODAR: cole este arquivo inteiro no Supabase → SQL Editor → Run.
--
-- MODELO DE SEGURANÇA (por que isto NÃO quebra o app):
--   • O backend acessa o banco via SUPABASE_SERVICE_ROLE_KEY (getSupabase() em
--     src/lib/pgDb.js). A role "service_role" tem BYPASSRLS — ou seja, TODAS as
--     rotas de API e server components continuam funcionando normalmente.
--   • O RLS só afeta as roles "anon" e "authenticated" (acesso direto pelo
--     client com a anon key). No app, o ÚNICO acesso client-side via anon key é
--     o BiolinkView.js, que lê apenas 'biolinks' e 'biolink_blocks'.
--   • Portanto: habilitamos RLS em TODAS as tabelas (negando anon por padrão) e
--     liberamos leitura pública apenas de biolinks/biolink_blocks.
--
-- PRÉ-REQUISITO: garanta que SUPABASE_SERVICE_ROLE_KEY está setada no .env.local
-- e na Vercel. Sem ela, o pgDb.js cai na anon key e o RLS bloquearia as leituras
-- do servidor.
-- ============================================================================

-- 1) Habilita RLS em TODAS as tabelas do schema public (idempotente e abrangente
--    — cobre inclusive tabelas que não estejam listadas explicitamente).
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- 2) Exceção: páginas de bio-link são públicas por natureza e são lidas
--    client-side via anon key (BiolinkView.js). Liberamos SOMENTE leitura.
--    (Se as tabelas tiverem uma coluna de publicação, troque `USING (true)` por
--     `USING (published = true)` para não expor rascunhos.)
DROP POLICY IF EXISTS "Public read biolinks" ON public.biolinks;
CREATE POLICY "Public read biolinks"
  ON public.biolinks
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public read biolink_blocks" ON public.biolink_blocks;
CREATE POLICY "Public read biolink_blocks"
  ON public.biolink_blocks
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- 3) Verificação — todas as tabelas devem aparecer com rowsecurity = true.
-- ============================================================================
SELECT tablename, rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
