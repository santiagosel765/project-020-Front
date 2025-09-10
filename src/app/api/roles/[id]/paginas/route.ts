import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

async function proxy(req: NextRequest, target: string) {
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    credentials: 'include',
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
  };
  const resp = await fetch(target, init);
  const respHeaders = new Headers(resp.headers);
  const data = await resp.arrayBuffer();
  return new NextResponse(data, { status: resp.status, headers: respHeaders });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxy(req, `${API_BASE}/roles/${params.id}/paginas`);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return proxy(req, `${API_BASE}/roles/${params.id}/paginas`);
}
