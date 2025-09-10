import { NextRequest } from 'next/server';
import { proxyRequest } from '../../_proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return proxyRequest(req, '/auth/logout');
}

