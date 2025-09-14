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

export type FirmanteResumen = {
  id: number;
  nombre: string;
  iniciales: string;
  urlFoto?: string | null;
  responsabilidad: string;
};

export type CuadroFirmaResumen = {
  id: number;
  titulo: string;
  descripcion?: string;
  codigo?: string;
  version?: string;
  nombre_pdf?: string;
  add_date?: string;
  estado_firma: { id: number; nombre: string };
  empresa: { id: number; nombre: string };
  diasTranscurridos?: number;
  firmantesResumen: FirmanteResumen[];
};

export type AsignacionDTO = {
  cuadro_firma: CuadroFirmaResumen;
  usuarioAsignado: any;
  usuarioCreador: { correo_institucional: string; codigo_empleado: string };
};

export type ByUserResponse = {
  asignaciones: AsignacionDTO[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    lastPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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

export async function getDocumentsByUser(
  userId: number,
  params?: Record<string, any>,
): Promise<ByUserResponse> {
  const { data } = await api.get(`/documents/cuadro-firmas/by-user/${userId}`, { params });
  const pag = unwrapPaginated<any>(data);
  const asignaciones = pag.items.length
    ? pag.items
    : unwrapArray<any>(data?.data?.asignaciones ?? data?.asignaciones ?? []);
  return {
    asignaciones,
    meta: (pag.meta as ByUserResponse["meta"]) || {
      totalCount: 0,
      page: 1,
      limit: 0,
      lastPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

export async function getFirmantesByCuadroId(id: number) {
  const { data } = await api.get(`/documents/cuadro-firmas/firmantes/${id}`);
  return unwrapArray<any>(data?.data ?? data?.firmantes ?? data);
}

export { getDocumentsByUser as getDocsByUser };

