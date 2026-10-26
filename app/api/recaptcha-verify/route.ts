import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ success: false, error: 'Verification is not configured' }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { token, action } = (body ?? {}) as { token?: unknown; action?: unknown };
  if (typeof token !== 'string' || !token || token.length > 4096 || token === 'no-key-dev-mode' ||
      typeof action !== 'string' || !['login', 'signup', 'checkout', 'post_job', 'ad_request', 'contact', 'apply_job'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Invalid verification request' }, { status: 400 });
  }
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Provider unavailable');
    const data = await response.json();
    const hostname = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).hostname;
    const age = Date.now() - Date.parse(data.challenge_ts);
    const success = data.success === true && typeof data.score === 'number' && data.score >= 0.5 &&
      data.action === action && data.hostname === hostname && age >= -10000 && age <= 120000;
    return NextResponse.json({ success }, { status: success ? 200 : 403 });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification unavailable' }, { status: 502 });
  }
}
