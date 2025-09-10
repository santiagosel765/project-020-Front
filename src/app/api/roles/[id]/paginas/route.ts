import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../_proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyRequest(req, `/roles/${id}/paginas`);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyRequest(req, `/roles/${id}/paginas`);
}
