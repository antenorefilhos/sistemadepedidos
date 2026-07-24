-- ============================================================================
-- Hierarquia de categorias (estilo WordPress) — Fase 1
-- ============================================================================
-- COMO RODAR: Supabase → SQL Editor → cole e Run.
--
-- parent_id NULL  = categoria de topo (raiz).
-- parent_id = X   = subcategoria da categoria X (prevalece a árvore).
-- position        = ordem entre categorias irmãs (mesmo pai). Menor vem primeiro.
--
-- ON DELETE SET NULL: se uma categoria-pai for excluída, as filhas viram de topo
-- (não somem junto).
-- ============================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Índice para consultas por pai (montagem da árvore).
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Verificação:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'categories'
  AND column_name IN ('parent_id', 'position');
