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

const mapEstado = (nombre?: string | null): DocEstado => {
  const n = (nombre ?? '').toLowerCase();
  if (n.includes('progreso')) return 'En Progreso';
  if (n.includes('complet')) return 'Completado';
  if (n.includes('rechaz')) return 'Rechazado';
  return 'Pendiente';
};

const toSupervisionDoc = (d: any): SupervisionDoc => ({
  id: Number(d.id),
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

export async function createCuadroFirma(
  payload:
    | FormData
    | {
        file?: File | Blob;
        responsables?: any;
        titulo?: any;
        descripcion?: any;
        version?: any;
        codigo?: any;
        empresa_id?: any;
        createdBy?: any;
        meta?: Record<string, any>;
      }
) {
  let body = payload instanceof FormData ? payload : new FormData();
  if (!(payload instanceof FormData)) {
    const { file, responsables, meta, ...rest } = payload ?? {};
    if (file) body.append('file', file as any);
    const metaObj: any = meta ?? rest;
    Object.entries(metaObj).forEach(([k, v]) => {
      if (v != null && k !== 'responsables') body.append(k, v as any);
    });
    const resp = (responsables ?? metaObj?.responsables) as any;
    if (resp != null) body.append('responsables', typeof resp === 'object' ? JSON.stringify(resp) : (resp as any));
  }
  const { data } = await api.post('/documents/cuadro-firmas', body);
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
  const arr = unwrapArray<any>(data?.data ?? data);
  return arr.map(toSupervisionDoc);
}

export { getDocumentsByUser as getDocsByUser };
