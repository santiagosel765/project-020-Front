import api from '@/lib/axiosConfig';
import { Api } from '@/types/api';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

function toFormData(obj: Record<string, any>) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(
      k,
      typeof v === "object" && !(v instanceof Blob) ? JSON.stringify(v) : v,
    );
  });
  return fd;
}

export async function uploadDocument(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/documents", fd);
  return normalizeOne<{ fileKey?: string }>(data);
}

export async function createCuadroFirma(args: {
  file: File;
  meta: Api.CreateCuadroFirmaDto;
  responsables: Api.ResponsablesFirmaDto;
}) {
  const fd = new FormData();
  fd.append("file", args.file);
  fd.append("titulo", args.meta.titulo);
  if (args.meta.descripcion) fd.append("descripcion", args.meta.descripcion);
  if (args.meta.version) fd.append("version", args.meta.version);
  if (args.meta.codigo) fd.append("codigo", args.meta.codigo);
  fd.append("empresa_id", String(args.meta.empresa_id));
  fd.append("createdBy", String(args.meta.createdBy));
  fd.append("responsables", JSON.stringify(args.responsables));
  const { data } = await api.post("/documents/cuadro-firmas", fd);
  return normalizeOne<any>(data);
}

export async function getCuadroFirma(id: number) {
  const { data } = await api.get(`/documents/cuadro-firmas/${id}`);
  return normalizeOne<any>(data);
}

export async function updateCuadroFirma(
  id: number,
  body: Partial<Api.CreateCuadroFirmaDto> & {
    responsables?: Api.ResponsablesFirmaDto;
    observaciones?: string;
  },
) {
  const fd = toFormData(body as any);
  const { data } = await api.patch(`/documents/cuadro-firmas/${id}`, fd);
  return normalizeOne<any>(data);
}

export async function patchDocumentoForCuadro(
  id: number,
  args: { file: File; idUser: number; observaciones?: string },
) {
  const fd = new FormData();
  fd.append("file", args.file);
  fd.append("idUser", String(args.idUser));
  if (args.observaciones) fd.append("observaciones", args.observaciones);
  const { data } = await api.patch(`/documents/cuadro-firmas/documento/${id}`, fd);
  return normalizeOne<any>(data);
}

export async function signCuadroFirma(body: Api.FirmaCuadroDto & { file: File }) {
  const fd = new FormData();
  fd.append("file", body.file);
  fd.append("userId", String(body.userId));
  fd.append("nombreUsuario", body.nombreUsuario);
  fd.append("cuadroFirmaId", String(body.cuadroFirmaId));
  fd.append("responsabilidadId", String(body.responsabilidadId));
  fd.append("nombreResponsabilidad", body.nombreResponsabilidad);
  const { data } = await api.post("/documents/cuadro-firmas/firmar", fd);
  return normalizeOne<any>(data);
}

export async function getDocumentoUrl(fileName: string) {
  const { data } = await api.get(`/documents/cuadro-firmas/documento-url`, {
    params: { fileName },
  });
  return normalizeOne<any>(data);
}

export async function getEstadosFirma() {
  const { data } = await api.get("/documents/estados-firma");
  return normalizeList<Api.EstadoFirma>(data);
}

export async function addHistorialCuadroFirma(
  body: Api.AddHistorialCuadroFirmaDto,
) {
  const { data } = await api.post("/documents/cuadro-firmas/historial", body);
  return normalizeOne<any>(data);
}

export async function getHistorialCuadroFirma(
  id: number,
  params?: Record<string, any>,
) {
  const { data } = await api.get(`/documents/cuadro-firmas/historial/${id}`, { params });
  return normalizeList<any>(data);
}

export async function getFirmantesCuadro(id: number) {
  const { data } = await api.get(`/documents/cuadro-firmas/firmantes/${id}`);
  return normalizeList<any>(data);
}

export async function getAssignmentsByUser(
  userId: number,
  params?: Record<string, any>,
) {
  const { data } = await api.get(`/documents/cuadro-firmas/by-user/${userId}`, {
    params,
  });
  return normalizeList<any>(data);
}

export async function getSupervisionDocs(params?: Record<string, any>) {
  const { data } = await api.get(`/documents/cuadro-firmas/documentos/supervision`, {
    params,
  });
  return normalizeList<any>(data);
}

export async function changeEstadoAsignacion(
  body: Api.UpdateEstadoAsignacionDto,
) {
  const { data } = await api.patch(`/documents/cuadro-firmas/estado`, body);
  return normalizeOne<any>(data);
}

export async function analyzePdfTest(file: File) {
  const fd = new FormData();
  fd.append("files", file);
  const { data } = await api.post(`/documents/analyze-pdf-test`, fd);
  return normalizeOne<string>(data);
}

export async function createPlantilla(body: Api.CreatePlantillaDto) {
  const { data } = await api.post(`/documents/plantilla`, body);
  return normalizeOne<any>(data);
}
