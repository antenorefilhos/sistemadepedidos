import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSupabase } from '@/lib/pgDb';
import { normalizePhone, phonesMatch, createAccessToken } from '@/lib/customerAuth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Resposta única e genérica: nunca revela se o número existe (anti-enumeração).
const GENERIC = {
  success: true,
  message: 'Se houver um cadastro com e-mail vinculado a este número, enviamos um link de acesso.',
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
};

async function sendMagicLink(email, name, link) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('SMTP não configurado — link de acesso não enviado.');
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from: `"Antenor & Filhos" <${from}>`,
    to: email,
    subject: 'Seu acesso à Minha Conta — Antenor & Filhos',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #ab9070;">Olá${name ? `, ${name}` : ''}!</h2>
        <p>Você solicitou acesso ao seu histórico de pedidos na <strong>Antenor &amp; Filhos</strong>.</p>
        <p>Clique no botão abaixo para entrar. O link é válido por <strong>15 minutos</strong> e de uso pessoal.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #ab9070; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Minha Conta</a>
        </p>
        <p style="font-size: 12px; color: #888;">Se você não solicitou este acesso, ignore este e-mail com segurança.</p>
      </div>
    `,
  });
}

export async function POST(req) {
  try {
    const rl = rateLimit(`customer-login:${getClientIp(req)}`, { limit: 5, windowMs: 60000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações. Aguarde um instante.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }
    const { phone } = await req.json();
    const digits = normalizePhone(phone);
    // Exige um mínimo de dígitos para evitar correspondência ampla.
    if (digits.length < 8) {
      return NextResponse.json(GENERIC);
    }

    const supabase = getSupabase();
    // Busca enxuta: apenas colunas necessárias para localizar o e-mail vinculado.
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_whatsapp, customer_email, customer_name, created_at')
      .not('customer_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5000);

    // Telefone é gravado sem padronização → normaliza e compara em JS.
    const match = (orders || []).find((o) => phonesMatch(o.customer_whatsapp, digits));

    if (match && match.customer_email) {
      const token = createAccessToken(digits);
      if (token) {
        const origin =
          req.headers.get('origin') ||
          (req.headers.get('host') ? `https://${req.headers.get('host')}` : null) ||
          process.env.SITE_URL ||
          'https://antenorefilhos.com.br';
        const link = `${origin}/conta?token=${encodeURIComponent(token)}`;
        try {
          await sendMagicLink(match.customer_email, match.customer_name, link);
        } catch (mailErr) {
          console.error('Falha ao enviar link de acesso:', mailErr);
        }
      }
    }

    return NextResponse.json(GENERIC);
  } catch (err) {
    console.error('customer-login error:', err);
    // Mesmo em erro, mantém resposta genérica para não vazar comportamento.
    return NextResponse.json(GENERIC);
  }
}
