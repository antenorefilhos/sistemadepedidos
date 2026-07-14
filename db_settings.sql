-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados padrão da empresa
INSERT INTO public.app_settings (key, value) VALUES
('company_data', '{"phone": "2422221482", "address": "Estrada União Indústria, 12273 - Itaipava", "hours": "Seg a Sab: 09h às 19h", "instagram": "@antenorefilhos"}'::jsonb),
('cardapio_images', '{"food": "/images/alacarte.jpg", "drinks": "/images/bebidas.jpg"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
