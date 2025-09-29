import { api } from '@/lib/api';
import { unwrapArray, unwrapOne } from '@/lib/apiEnvelope';
import { PageEnvelope } from '@/lib/pagination';
import { initials, fullName, initialsFromFullName } from '@/lib/avatar';

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

export type DocumentoRow = {
  id: number;
  titulo: string;
  descripcion: string;
  codigo?: string | null;
  version?: string | null;
  add_date: string;
  addDate?: string | null;
  estado: { id: number; nombre: string };
  estado_firma?: { id: number; nombre: string } | null;
  empresa: { id: number; nombre: string };
  diasTranscurridos?: number;
  descripcionEstado?: string;
  firmantesResumen?: Array<{
    id: number;
    nombre: string;
    iniciales: string;
    urlFoto: string | null;
    avatar?: string | null;
    responsabilidad: string;
  }>;
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

export type Signer = {
  id: number;
  nombre: string;
  iniciales: string;
  responsabilidad: string;
  puesto?: string | null;
  gerencia?: string | null;
  estaFirmado: boolean;
  diasTranscurridos?: number;
  urlFoto?: string | null;
  avatar?: string | null;
};

export type DocumentDetail = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  version?: string | null;
  codigo?: string | null;
  progress: number;
  diasTranscurridosDocumento: number;
  urlCuadroFirmasPDF: string;
  urlDocumento: string;
  firmantes: Signer[];
};

export type SignerSummary = {
  estaFirmado: boolean;
  user: {
    id: number;
    primer_nombre: string | null;
    segundo_name?: string | null;
    tercer_nombre?: string | null;
    primer_apellido: string | null;
    segundo_apellido?: string | null;
    apellido_casada?: string | null;
    correo_institucional: string;
    codigo_empleado?: string | null;
    posicion?: { nombre?: string | null } | null;
    gerencia?: { nombre?: string | null } | null;
    url_foto?: string | null;
    urlFoto?: string | null;
    avatar?: string | null;
    foto_perfil?: string | null;
  };
  responsabilidad_firma: { id: number; nombre: string };
};

export type SignerPending = {
  userId: number;
  responsabilidadId: number;
  nombreResponsabilidad: 'Elabora' | 'Revisa' | 'Aprueba' | 'Enterado' | string;
  yaFirmo: boolean;
};

export type SignerFull = {
  user: {
    id: number;
    nombre: string;
    posicion?: string;
    gerencia?: string;
    urlFoto?: string | null;
    avatar?: string | null;
  };
  responsabilidad: { id: number; nombre: string };
  estaFirmado: boolean;
};

export type AsignacionDTO = {
  cuadro_firma: CuadroFirmaResumen;
  usuarioAsignado: any;
  usuarioCreador: { correo_institucional: string; codigo_empleado: string };
};

const toDocumentoRow = (d: any): DocumentoRow => {
  const x = d?.cuadro_firma ?? d ?? {};
  const firmantes = Array.isArray(x.firmantesResumen)
    ? x.firmantesResumen.map((f: any) => ({
        id: Number(f.id ?? 0),
        nombre: f.nombre ?? '',
        iniciales: f.iniciales ?? initials(f.nombre ?? ''),
        ...(() => {
          const foto = f.urlFoto ?? f.avatar ?? null;
          return { urlFoto: foto, avatar: foto };
        })(),
        responsabilidad: f.responsabilidad ?? '',
      }))
    : Array.isArray(x.cuadro_firma_user)
    ? x.cuadro_firma_user.map((f: any) => {
        const u = f.user ?? {};
        const foto = u.urlFoto ?? u.url_foto ?? u.foto_perfil ?? null;
        const nombre = [
          u.primer_nombre,
          u.segundo_name,
          u.tercer_nombre,
          u.primer_apellido,
          u.segundo_apellido,
          u.apellido_casada,
        ]
          .filter(Boolean)
          .join(' ');
        return {
          id: Number(u.id ?? f.user_id ?? 0),
          nombre,
          iniciales: initials(nombre ?? ''),
          urlFoto: foto,
          avatar: foto,
          responsabilidad: f.responsabilidad_firma?.nombre ?? '',
        };
      })
    : undefined;
  return {
    id: Number(x.id ?? 0),
    titulo: x.titulo ?? '',
    descripcion: x.descripcion ?? '',
    codigo: x.codigo ?? null,
    version: x.version ?? null,
    add_date: x.add_date ?? x.addDate ?? '',
    addDate: x.add_date ?? x.addDate ?? null,
    estado:
      x.estado_firma ?? x.estado ?? ({ id: 0, nombre: '' } as {
        id: number;
        nombre: string;
      }),
    estado_firma: x.estado_firma ?? null,
    empresa: x.empresa ?? ({ id: 0, nombre: '' } as { id: number; nombre: string }),
    diasTranscurridos: x.diasTranscurridos ?? undefined,
    descripcionEstado: x.descripcionEstado ?? undefined,
    firmantesResumen: firmantes,
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
    estado: (x?.estado_firma?.nombre ?? x?.estado?.nombre ?? '') as DocEstado,
    empresa: x.empresa ?? null,
    diasTranscurridos: x.diasTranscurridos ?? undefined,
    descripcionEstado: x.descripcionEstado ?? null,
  };
};

type PaginationRequest = {
  page: number;
  limit: number;
  sort: 'asc' | 'desc';
};

export type DocumentSupervisionParams = PaginationRequest & {
  search?: string;
  estado?: string;
  [key: string]: unknown;
};

export type DocumentsByUserParams = PaginationRequest & {
  search?: string;
  estado?: string;
  [key: string]: unknown;
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

export async function getDocumentSupervision(
  params: DocumentSupervisionParams,
): Promise<PageEnvelope<DocumentoRow>> {
  const { page, limit, sort, search, estado, ...rest } = params;
  const query: Record<string, unknown> = {
    page,
    limit,
    sort,
    ...rest,
  };

  if (typeof search === 'string' && search.trim() !== '') {
    query.search = search.trim();
  }

  if (typeof estado === 'string' && estado.trim() !== '' && estado !== 'Todos') {
    query.estado = estado;
  }

  const { data } = await api.get<PageEnvelope<any>>(
    '/documents/cuadro-firmas/documentos/supervision',
    {
      params: query,
    },
  );

  const envelope = data as PageEnvelope<any>;
  const items = Array.isArray(envelope.items)
    ? envelope.items.map(toDocumentoRow)
    : [];

  return {
    ...envelope,
    items,
  };
}

export async function getSupervisionStats(params?: { search?: string }) {
  const { data } = await api.get<any>('/documents/cuadro-firmas/documentos/supervision/stats', { params });
  const payload = data as any;
  return (payload?.data ?? payload) as Record<
    'Todos' | 'Pendiente' | 'En Progreso' | 'Rechazado' | 'Completado',
    number
  >;
}

export async function getDocumentsByUser(
  userId: number,
  params: DocumentsByUserParams,
): Promise<PageEnvelope<AsignacionDTO>> {
  const { page, limit, sort, search, estado, ...rest } = params;

  const query: Record<string, unknown> = {
    page,
    limit,
    sort,
    ...rest,
  };

  if (typeof search === 'string' && search.trim() !== '') {
    query.search = search.trim();
  }

  if (typeof estado === 'string' && estado.trim() !== '' && estado !== 'Todos') {
    query.estado = estado;
  }

  const { data } = await api.get<PageEnvelope<any>>(
    `/documents/cuadro-firmas/by-user/${userId}`,
    { params: query },
  );

  const envelope = data as PageEnvelope<any>;
  const items = Array.isArray(envelope.items)
    ? (envelope.items as AsignacionDTO[])
    : [];

  return {
    ...envelope,
    items,
  };
}

export async function getByUserStats(userId: number, params?: { search?: string }) {
  const { data } = await api.get<any>(`/documents/cuadro-firmas/by-user/${userId}/stats`, { params });
  const payload = data as any;
  return (payload?.data ?? payload) as Record<
    'Todos' | 'Pendiente' | 'En Progreso' | 'Rechazado' | 'Completado',
    number
  >;
}

export async function getFirmantes(cuadroId: number): Promise<SignerSummary[]> {
  const { data } = await api.get<any>(`/documents/cuadro-firmas/firmantes/${cuadroId}`);
  return unwrapArray<SignerSummary>(data?.data ?? data?.firmantes ?? data);
}

export type CuadroFirmaDetalle = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  version?: string | null;
  codigo?: string | null;
  empresa?: { id: number; nombre: string } | null;
  urlCuadroFirmasPDF: string;
  urlDocumento: string;
};

export async function getCuadroFirmaDetalle(id: number, expiresIn?: number): Promise<CuadroFirmaDetalle> {
  const { data } = await api.get<any>(`/documents/cuadro-firmas/${id}`, {
    params: expiresIn ? { expiresIn } : undefined,
    headers: { 'Cache-Control': 'no-store' },
  });
  const x = unwrapOne<any>(data?.data ?? data);
  return {
    id: Number(x.id ?? 0),
    titulo: x.titulo ?? '',
    descripcion: x.descripcion ?? null,
    version: x.version ?? null,
    codigo: x.codigo ?? null,
    empresa: x.empresa ?? null,
    urlCuadroFirmasPDF: x.urlCuadroFirmasPDF ?? '',
    urlDocumento: x.urlDocumento ?? '',
  };
}

export async function getDocumentDetail(id: number): Promise<DocumentDetail> {
  const { data } = await api.get<any>(`/documents/cuadro-firmas/${id}`, {
    headers: { 'Cache-Control': 'no-store' },
  });
  const x = unwrapOne<any>(data?.data ?? data);
  const firmantes: Signer[] = Array.isArray(x.cuadro_firma_user)
    ? x.cuadro_firma_user.map((f: any) => {
        const u = f.user ?? {};
        const foto = u.urlFoto ?? u.url_foto ?? u.foto_perfil ?? null;
        return {
          id: Number(u.id ?? 0),
          nombre: fullName(u),
          iniciales: initialsFromFullName(
            u.primer_nombre,
            u.segundo_name,
            u.tercer_nombre,
            u.primer_apellido,
            u.segundo_apellido,
            u.apellido_casada,
          ),
          responsabilidad: f.responsabilidad_firma?.nombre ?? '',
          puesto: u.posicion?.nombre ?? null,
          gerencia: u.gerencia?.nombre ?? null,
          estaFirmado: Boolean(f.estaFirmado),
          diasTranscurridos: f.diasTranscurridos ?? undefined,
          urlFoto: foto,
          avatar: foto,
        } as Signer;
      })
    : [];
  return {
    id: Number(x.id ?? 0),
    titulo: x.titulo ?? '',
    descripcion: x.descripcion ?? null,
    version: x.version ?? null,
    codigo: x.codigo ?? null,
    progress: Number(x.progress ?? 0),
    diasTranscurridosDocumento: Number(x.diasTranscurridosDocumento ?? 0),
    urlCuadroFirmasPDF: x.urlCuadroFirmasPDF ?? '',
    urlDocumento: x.urlDocumento ?? '',
    firmantes,
  };
}

export async function fetchMergedPdf(
  cuadroFirmasId: number,
  opts?: { download?: boolean; signal?: AbortSignal },
) {
  const { data } = await api.get(`/documents/cuadro-firmas/${cuadroFirmasId}/merged-pdf`, {
    params: opts?.download ? { download: 1 } : undefined,
    responseType: 'blob',       // <- importante para recibir un Blob
    signal: opts?.signal as any,
    withCredentials: true,
    timeout: 60000,
  });

  return data as Blob;
}
export { getDocumentsByUser as getDocsByUser };

export async function signDocument(payload: {
  cuadroFirmaId: number;
  userId: number;
  nombreUsuario: string;
  responsabilidadId: number;
  nombreResponsabilidad: string;
  file?: File;
  useStoredSignature?: boolean;
}): Promise<{ status: number; message?: string }> {
  const form = new FormData();
  form.append('cuadroFirmaId', String(payload.cuadroFirmaId));
  form.append('userId', String(payload.userId));
  form.append('nombreUsuario', payload.nombreUsuario);
  form.append('responsabilidadId', String(payload.responsabilidadId));
  form.append('nombreResponsabilidad', payload.nombreResponsabilidad);
  if (payload.useStoredSignature) {
    form.append('useStoredSignature', 'true');
  } else if (payload.file) {
    form.append('file', payload.file);
  }

  try {
    const res = await api.post('/documents/cuadro-firmas/firmar', form);
    return { status: res.status, message: (res.data as any)?.message };
  } catch (e: any) {
    if (e.status === 403) {
      const err: any = new Error('Usuario no autorizado');
      err.status = 403;
      throw err;
    }
    throw e;
  }
}

