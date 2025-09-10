import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;
const isBodyless = (m: string) => m === 'GET' || m === 'HEAD';

export async function proxyRequest(req: NextRequest, targetPath: string) {
  const target = `${API_BASE}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;

  const headers = new Headers(req.headers);
  const incomingCookie = req.headers.get('cookie');
  if (incomingCookie) headers.set('cookie', incomingCookie);
  headers.delete('host');
  headers.delete('content-length');

  const body = isBodyless(req.method) ? undefined : await req.arrayBuffer();

  const backendRes = await fetch(target, {
    method: req.method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
    redirect: 'manual',
  });

  const ct = backendRes.headers.get('content-type') || '';
  let resp: NextResponse;

  if (ct.includes('application/json')) {
    const data = await backendRes.json();
    resp = NextResponse.json(data, { status: backendRes.status });
  } else {
    const buf = await backendRes.arrayBuffer();
    resp = new NextResponse(buf, {
      status: backendRes.status,
      headers: { 'content-type': ct || 'application/octet-stream' },
    });
  }

  const setCookies =
    (backendRes.headers as any).getSetCookie?.() ??
    (backendRes.headers.get('set-cookie')
      ? [backendRes.headers.get('set-cookie')!]
      : []);

  for (const c of setCookies) {
    resp.headers.append('set-cookie', c);
  }

  resp.headers.set('Cache-Control', 'no-store');
  resp.headers.delete('content-length');

  return resp;
}
