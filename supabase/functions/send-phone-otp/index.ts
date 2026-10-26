import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
Deno.serve(async (req: Request) => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  try {
    const base = Deno.env.get('SUPABASE_URL')!;
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return reply({ error: 'unauthenticated' }, 401);
    const client = createClient(base, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: 'unauthenticated' }, 401);
    const service = createClient(base, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: profile } = await service.from('profiles').select('is_banned').eq('id', auth.user.id).maybeSingle();
    if (!profile || profile.is_banned) return reply({ error: 'forbidden' }, 403);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.phone !== 'string') return reply({ error: 'invalid_phone' }, 400);
    const phone = body.phone.replace(/[\s\-().]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return reply({ error: 'invalid_phone' }, 400);
    const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');

    if (body.action === 'send') {
      const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const secret = Deno.env.get('TWILIO_AUTH_TOKEN');
      const from = Deno.env.get('TWILIO_FROM_NUMBER');
      if (!sid || !secret || !from) return reply({ error: 'sms_not_configured' }, 503);
      const random = crypto.getRandomValues(new Uint32Array(1))[0];
      const code = String(100000 + random % 900000);
      const { data: issued, error } = await service.rpc('issue_phone_verification_code', {
        p_phone: phone, p_code_hash: await hash(code), p_user_id: auth.user.id,
      });
      if (error) return reply({ error: 'storage_failed' }, 500);
      if (issued !== 'sent') return reply({ error: issued }, 429);
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${btoa(`${sid}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: phone, From: from, Body: `Turanda dogrulama kodunuz: ${code}` }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return reply({ error: 'sms_delivery_failed' }, 502);
      return reply({ sent: true, delivered: true, expires_in: 600 });
    }
    if (body.action === 'verify') {
      if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return reply({ error: 'invalid_code' }, 400);
      const { data: result, error } = await service.rpc('verify_phone_verification_code', {
        p_phone: phone, p_code_hash: await hash(body.code), p_user_id: auth.user.id,
      });
      if (error) return reply({ error: 'verification_failed' }, 500);
      return result === 'verified' ? reply({ verified: true }) : reply({ error: result }, result === 'too_many_attempts' ? 429 : 400);
    }
    return reply({ error: 'unknown_action' }, 400);
  } catch {
    return reply({ error: 'verification_unavailable' }, 500);
  }
});
