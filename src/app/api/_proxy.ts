import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export async function proxyRequest(req: NextRequest, targetPath: string) {
  const headers = new Headers(req.headers);
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  headers.delete('host');
  headers.delete('content-length');

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    credentials: 'include',
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
  };

  const res = await fetch(`${API_BASE}${targetPath}`, init);
  const data = await res.arrayBuffer();
  const resHeaders = new Headers(res.headers);
  resHeaders.set('cache-control', 'no-store');

  const setCookie = (res.headers as any).getSetCookie?.() || (res.headers as any).raw?.()['set-cookie'];
  if (Array.isArray(setCookie)) {
    setCookie.forEach((c: string) => resHeaders.append('set-cookie', c));
  } else if (typeof setCookie === 'string') {
    resHeaders.append('set-cookie', setCookie);
  }

  return new NextResponse(data, { status: res.status, headers: resHeaders });
}
