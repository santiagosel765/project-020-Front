import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const isBodylessMethod = (m: string) => m === 'GET' || m === 'HEAD';

export async function proxyRequest(req: NextRequest, targetPath: string) {
  const search = req.nextUrl?.search ?? '';
  const targetBase = `${API_BASE}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
  const target = `${targetBase}${search}`;

  const headers = new Headers(req.headers);
  const incomingCookie = req.headers.get('cookie');
  if (incomingCookie) headers.set('cookie', incomingCookie);

  headers.delete('host');
  headers.delete('content-length');

  const body = isBodylessMethod(req.method) ? undefined : await req.arrayBuffer();

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'manual',
  });

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'content-length' || k === 'transfer-encoding' || k === 'connection') return;
    if (k === 'content-encoding') return;
    if (k === 'set-cookie') return;
    resHeaders.append(key, value);
  });

  resHeaders.set('cache-control', 'no-store');

  const setCookiesFromGetSetCookie = (upstream.headers as any).getSetCookie?.();
  const setCookiesFromRaw = (upstream.headers as any).raw?.()?.['set-cookie'];
  const setCookieSingle = upstream.headers.get('set-cookie');

  if (Array.isArray(setCookiesFromGetSetCookie)) {
    for (const c of setCookiesFromGetSetCookie) resHeaders.append('set-cookie', c);
  } else if (Array.isArray(setCookiesFromRaw)) {
    for (const c of setCookiesFromRaw) resHeaders.append('set-cookie', c);
  } else if (typeof setCookieSingle === 'string' && setCookieSingle) {
    resHeaders.append('set-cookie', setCookieSingle);
  }

  const status = upstream.status;

  if (status === 204 || status === 304) {
    return new NextResponse(null, { status, headers: resHeaders });
  }

  const buf = await upstream.arrayBuffer();
  if (!resHeaders.has('content-type')) {
    resHeaders.set('content-type', 'application/octet-stream');
  }

  resHeaders.delete('content-length');

  return new NextResponse(buf, { status, headers: resHeaders });
}
