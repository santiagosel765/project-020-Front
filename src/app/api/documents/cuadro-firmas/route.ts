import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API = process.env.BACKEND_URL ?? 'http://localhost:3200/api/v1';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const r = await fetch(`${API}/documents/cuadro-firmas/documentos/supervision`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
