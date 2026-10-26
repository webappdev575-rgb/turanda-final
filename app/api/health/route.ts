import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
/** Liveness only; no database query, credentials, versions, or user information. */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
