import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${API_BASE}/${params.path.join('/')}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    redirect: 'manual',
  };

  const resp = await fetch(target, init);

  const respHeaders = new Headers(resp.headers);
  const data = await resp.arrayBuffer();
  return new NextResponse(data, {
    status: resp.status,
    headers: respHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
