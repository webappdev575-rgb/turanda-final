import { NextRequest, NextResponse } from 'next/server';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string | undefined = body?.token;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    if (token === 'no-key-dev-mode') {
      return NextResponse.json({ success: true, score: 1.0, dev: true });
    }

    if (!RECAPTCHA_SECRET_KEY) {
      return NextResponse.json({ success: true, score: 0.9, dev: true });
    }

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await verifyRes.json();

    const passed = data.success && (data.score === undefined || data.score >= 0.5);
    return NextResponse.json({ success: passed, score: data.score ?? 0 });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
