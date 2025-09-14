import api from '@/lib/axiosConfig';
import { unwrapArray, unwrapPaginated, unwrapOne } from '@/lib/apiEnvelope';

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

const toSupervisionDoc = (d: any): SupervisionDoc => {
  const x = d?.cuadro_firma ?? d ?? {};
  return {
    id: Number(x.id ?? 0),
    titulo: x.titulo ?? '',
    descripcion: x.descripcion ?? null,
    codigo: x.codigo ?? null,
    version: x.version ?? null,
    addDate: x.add_date ?? x.addDate ?? null,
    estado: (x?.estado_firma?.nombre ?? '') as DocEstado,
    empresa: x.empresa ?? null,
    diasTranscurridos: x.diasTranscurridos ?? undefined,
    descripcionEstado: x.descripcionEstado ?? null,
  };
};

export async function createCuadroFirma(body: FormData) {
  const { data } = await api.post('/documents/cuadro-firmas', body, { timeout: 60000 });
  return unwrapOne<any>(data);
}

export async function updateCuadroFirma(id: number, payload: Record<string, any>) {
  const { data } = await api.patch(`/documents/cuadro-firmas/${id}`, payload);
  return unwrapOne<any>(data);
}

export async function updateDocumentoAsignacion(
  id: number,
  payload: { file: File | Blob; idUser?: number | string; observaciones?: string },
) {
  const body = new FormData();
  if (payload.file) body.append('file', payload.file as any);
  if (payload.idUser != null) body.append('idUser', String(payload.idUser));
  if (payload.observaciones) body.append('observaciones', payload.observaciones);
  const { data } = await api.patch(`/documents/cuadro-firmas/documento/${id}`, body);
  return unwrapOne<any>(data);
}

export async function getDocumentSupervision(params?: Record<string, any>) {
  const { data } = await api.get('/documents/cuadro-firmas/documentos/supervision', { params });
  const pag = unwrapPaginated<any>(data);
  const src = pag.items.length ? pag.items : unwrapArray<any>(data?.data ?? data?.documentos ?? data);
  return { items: src.map(toSupervisionDoc), meta: pag.meta };
}

export async function getDocumentsByUser(userId: number, params?: Record<string, any>) {
  const { data } = await api.get(`/documents/cuadro-firmas/by-user/${userId}`, { params });
  const pag = unwrapPaginated<any>(data);
  const asignaciones = pag.items.length
    ? pag.items
    : unwrapArray<any>(data?.data?.asignaciones ?? data?.asignaciones ?? []);
  const docs = asignaciones.map((a: any) => {
    const cf = a?.cuadro_firma ?? {};
    return {
      ...cf,
      id: cf?.id ?? a?.id,
      descripcionEstado: cf?.descripcionEstado ?? a?.descripcionEstado ?? null,
    };
  });
  return { items: docs.map(toSupervisionDoc), meta: pag.meta };
}

export { getDocumentsByUser as getDocsByUser };

