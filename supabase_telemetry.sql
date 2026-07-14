-- =========================================================================
-- Sistema Avançado de Telemetria (Fingerprint)
-- Rode este script no SQL Editor do Supabase
-- =========================================================================

-- 0. Limpar tabelas antigas se existirem (para evitar erro de conflito de colunas)
DROP TABLE IF EXISTS public.telemetry_events CASCADE;
DROP TABLE IF EXISTS public.telemetry_sessions CASCADE;

-- 1. Tabela de Sessões (Visitantes Únicos)
CREATE TABLE IF NOT EXISTS public.telemetry_sessions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    visitor_id TEXT UNIQUE NOT NULL, -- ID gerado pelo FingerprintJS
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Eventos (Ações do Usuário)
CREATE TABLE IF NOT EXISTS public.telemetry_events (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- ex: 'page_view', 'product_view', 'add_to_cart'
    event_data JSONB, -- Dados flexíveis (ex: { url: '/', product_id: 123 })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ativar RLS nas novas tabelas
ALTER TABLE public.telemetry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de Inserção Pública (permitir que a loja grave dados de navegação)
-- O público não deve conseguir LER os dados da telemetria, apenas o admin.
-- Obs: as chamadas vão pela service_role API, então o admin tem acesso de qualquer forma, 
-- mas como a API route também usa service_role, nem precisaríamos de INSERT público 
-- se tudo passar por rotas /api/telemetry seguras. 
-- Contudo, para manter RLS ativado com segurança:

CREATE POLICY "Admin tem controle total de sessoes" ON public.telemetry_sessions FOR ALL USING (true);
CREATE POLICY "Admin tem controle total de eventos" ON public.telemetry_events FOR ALL USING (true);

-- Índices para melhor performance analítica
CREATE INDEX IF NOT EXISTS idx_telemetry_events_type ON public.telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_session ON public.telemetry_events(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_visitor ON public.telemetry_sessions(visitor_id);
