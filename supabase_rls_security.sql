-- Script Impeccable: Blindagem do Banco de Dados (RLS)
-- Este script bloqueia o acesso não autorizado à API REST pública do Supabase,
-- permitindo apenas leitura do catálogo e criação de pedidos para visitantes.
-- O Admin continuará tendo acesso total através da Service Role Key.

-- 1. Ativar RLS em todas as tabelas principais
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Se existirem tabelas do Hermes, ativar também (ignora erro se não existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hermes_config') THEN
        ALTER TABLE public.hermes_config ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.hermes_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.hermes_messages ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 2. Remover políticas antigas (se existirem) para evitar conflitos
DROP POLICY IF EXISTS "Leitura Pública de Produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura Pública de Categorias" ON public.categories;
DROP POLICY IF EXISTS "Leitura Pública de Relacoes" ON public.product_categories;
DROP POLICY IF EXISTS "Leitura Pública de Vendedores" ON public.sellers;
DROP POLICY IF EXISTS "Visitantes Podem Criar Pedidos" ON public.orders;
DROP POLICY IF EXISTS "Visitantes Podem Criar Itens do Pedido" ON public.order_items;
-- (A tabela recipes já tem política da task anterior, recriaremos por segurança)
DROP POLICY IF EXISTS "Leitura Pública de Receitas" ON public.recipes;

-- 3. Criar Políticas de LEITURA (Apenas SELECT) para o Catálogo Público
-- Isso permite que a loja (frontend) busque produtos, categorias e receitas, mas ninguém pode deletar nada.
CREATE POLICY "Leitura Pública de Produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Leitura Pública de Categorias" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Leitura Pública de Relacoes" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Leitura Pública de Vendedores" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Leitura Pública de Receitas" ON public.recipes FOR SELECT USING (true);

-- 4. Criar Políticas de ESCRITA (Apenas INSERT) para Pedidos
-- Isso permite que clientes finalizem compras, mas não possam ler, alterar ou deletar pedidos de outros.
CREATE POLICY "Visitantes Podem Criar Pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Visitantes Podem Criar Itens do Pedido" ON public.order_items FOR INSERT WITH CHECK (true);

-- 5. Segurança do Admin (Service Role)
-- A chave 'service_role' (que sua API Next.js usa) por padrão IGNORA as regras RLS.
-- Ou seja, o painel /admin continuará podendo Criar/Editar/Deletar normalmente.
-- Não é necessário criar políticas para UPDATE/DELETE pois a service_role tem passe livre.

-- =========================================================================
-- PRONTO! Após executar este script, o aviso de "Table publicly accessible"
-- vai sumir do seu painel e os dados estarão seguros.
-- =========================================================================
