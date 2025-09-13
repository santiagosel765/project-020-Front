import api from '@/lib/axiosConfig';
import { unwrapArray, unwrapPaginated } from '@/lib/apiEnvelope';

export type DocEstado = 'Pendiente' | 'En Progreso' | 'Rechazado' | 'Completado';
export type SupervisionDoc = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  codigo?: string | null;
  version?: string | null;
  addDate?: string;
  estado: DocEstado;
  empresa?: { id: number; nombre: string } | null;
  diasTranscurridos?: number;
  descripcionEstado?: string | null;
};

const mapEstado = (nombre?: string | null): DocEstado => {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('progreso')) return 'En Progreso';
  if (n.includes('complet')) return 'Completado';
  if (n.includes('rechaz')) return 'Rechazado';
  return 'Pendiente';
};

const toSupervisionDoc = (d: any): SupervisionDoc => ({
  id: d.id,
  titulo: d.titulo ?? '',
  descripcion: d.descripcion ?? null,
  codigo: d.codigo ?? null,
  version: d.version ?? null,
  addDate: d.add_date ?? d.addDate,
  estado: mapEstado(d?.estado_firma?.nombre),
  empresa: d.empresa ?? null,
  diasTranscurridos: d.diasTranscurridos ?? undefined,
  descripcionEstado: d.descripcionEstado ?? null,
});

export async function getDocumentSupervision(params?: Record<string, any>) {
  const { data } = await api.get('/documents/cuadro-firmas/documentos/supervision', { params });
  // Soporta:
  // {status:202,data:{documentos:[...],meta:{...}}}  ||  {items:[...],meta:{...}}  ||  [...]
  const pag = unwrapPaginated<any>(data);
  const docs = (pag.items.length ? pag.items : unwrapArray<any>(data?.data)).map(toSupervisionDoc);
  return { items: docs, meta: pag.meta };
}

export async function getDocsByUser(userId: number, params?: Record<string, any>) {
  const { data } = await api.get(`/documents/cuadro-firmas/by-user/${userId}`, { params });
  // Si viene {status:400, data:"No hay ..."} => devolver []
  const arr = unwrapArray<any>(data);
  return arr.map(toSupervisionDoc);
}
