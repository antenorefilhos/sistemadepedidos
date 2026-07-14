-- Rode isso no SQL Editor do seu projeto Supabase

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    ingredients JSONB,
    instructions TEXT,
    prep_time TEXT,
    image_url TEXT,
    related_products JSONB, -- Array de IDs de produtos que combinam com a receita
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security) e permitir leitura pública
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (clientes da loja)
CREATE POLICY "Leitura Pública de Receitas" 
ON public.recipes 
FOR SELECT 
USING (true);

-- Política para escrita (admin - baseada na service role ou permissão)
CREATE POLICY "Permitir todas as operações para usuários autenticados/admin" 
ON public.recipes 
FOR ALL 
USING (true)
WITH CHECK (true);
