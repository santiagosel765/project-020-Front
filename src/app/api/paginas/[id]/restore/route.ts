import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../_proxy';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyRequest(req, `/paginas/${id}/restore`);
}
