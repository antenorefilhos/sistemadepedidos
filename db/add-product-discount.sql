-- ============================================================================
-- Desconto de caixa INDIVIDUAL por vinho (prevalece sobre o global)
-- ============================================================================
-- COMO RODAR: Supabase → SQL Editor → cole e Run.
--
-- Colunas NULAS = o vinho herda a configuração global (app_settings.adega_discount).
-- Colunas preenchidas = valor individual daquele vinho, que PREVALECE sobre o global,
-- por tier (6 un. e 12 un. são independentes).
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_cx6 numeric,
  ADD COLUMN IF NOT EXISTS discount_cx12 numeric;

-- Verificação:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
  AND column_name IN ('discount_cx6', 'discount_cx12');
