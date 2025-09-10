import { NextRequest } from 'next/server';
import { proxyRequest } from '../_proxy';

export async function GET(req: NextRequest) {
  return proxyRequest(req, '/paginas');
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/paginas');
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req, '/paginas');
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req, '/paginas');
}
