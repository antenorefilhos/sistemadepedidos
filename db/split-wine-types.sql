-- ============================================================================
-- Separa os TIPOS de vinho dos PAÍSES em taxonomias distintas
-- ============================================================================
-- COMO RODAR: Supabase → SQL Editor → cole e Run.
--
-- Antes: tipos (Tinto/Branco/Rosé/Espumante) e países ficavam juntos em
--   'sessoes_vinho_' (o "balaio").
-- Depois: os tipos passam para a taxonomia própria 'tipos_vinho_'; os países
--   permanecem em 'sessoes_vinho_'.
--
-- Os vínculos produto↔categoria são preservados (a categoria só muda de
-- taxonomia; os IDs não mudam).
-- ============================================================================

UPDATE public.categories
SET type = 'tipos_vinho_'
WHERE type = 'sessoes_vinho_'
  AND lower(slug) IN ('tinto', 'branco', 'rose', 'espumante');

-- Verificação:
SELECT type, name, slug
FROM public.categories
WHERE type IN ('tipos_vinho_', 'sessoes_vinho_')
ORDER BY type, name;
