import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string | undefined = body?.token;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const result = await verifyRecaptchaToken(token);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
