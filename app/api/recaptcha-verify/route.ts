import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: unknown = body?.token;
    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const devMode = process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !secret;
    if (devMode && token === 'no-key-dev-mode') {
      return NextResponse.json({ success: true, score: 1, dev: true });
    }
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Verification is not configured' }, { status: 503 });
    }

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
    });
    if (!verifyRes.ok) throw new Error('Provider unavailable');
    const data = await verifyRes.json();
    const actionMatches = typeof body.action !== 'string' || data.action === body.action;
    const passed = data.success === true && actionMatches && (data.score === undefined || data.score >= 0.5);
    return NextResponse.json({ success: passed, score: data.score ?? 0 });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
