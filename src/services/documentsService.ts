import api from "./axiosConfig";
import { Api } from "@/types/api";

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
  return (await api.post("/v1/documents", fd)).data as { fileKey?: string };
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
  return (await api.post("/v1/documents/cuadro-firmas", fd)).data;
}

export async function getCuadroFirma(id: number) {
  return (await api.get(`/v1/documents/cuadro-firmas/${id}`)).data;
}

export async function updateCuadroFirma(
  id: number,
  body: Partial<Api.CreateCuadroFirmaDto> & {
    responsables?: Api.ResponsablesFirmaDto;
    observaciones?: string;
  },
) {
  const fd = toFormData(body as any);
  return (await api.patch(`/v1/documents/cuadro-firmas/${id}`, fd)).data;
}

export async function patchDocumentoForCuadro(
  id: number,
  args: { file: File; idUser: number; observaciones?: string },
) {
  const fd = new FormData();
  fd.append("file", args.file);
  fd.append("idUser", String(args.idUser));
  if (args.observaciones) fd.append("observaciones", args.observaciones);
  return (await api.patch(`/v1/documents/cuadro-firmas/documento/${id}`, fd)).data;
}

export async function signCuadroFirma(body: Api.FirmaCuadroDto & { file: File }) {
  const fd = new FormData();
  fd.append("file", body.file);
  fd.append("userId", String(body.userId));
  fd.append("nombreUsuario", body.nombreUsuario);
  fd.append("cuadroFirmaId", String(body.cuadroFirmaId));
  fd.append("responsabilidadId", String(body.responsabilidadId));
  fd.append("nombreResponsabilidad", body.nombreResponsabilidad);
  return (await api.post("/v1/documents/cuadro-firmas/firmar", fd)).data;
}

export async function getDocumentoUrl(fileName: string) {
  return (
    await api.get(`/v1/documents/cuadro-firmas/documento-url`, {
      params: { fileName },
    })
  ).data;
}

export async function getEstadosFirma() {
  return (await api.get("/v1/documents/estados-firma")).data as Api.EstadoFirma[];
}

export async function addHistorialCuadroFirma(
  body: Api.AddHistorialCuadroFirmaDto,
) {
  return (await api.post("/v1/documents/cuadro-firmas/historial", body)).data;
}

export async function getHistorialCuadroFirma(
  id: number,
  params?: Record<string, any>,
) {
  return (
    await api.get(`/v1/documents/cuadro-firmas/historial/${id}`, { params })
  ).data;
}

export async function getFirmantesCuadro(id: number) {
  return (await api.get(`/v1/documents/cuadro-firmas/firmantes/${id}`)).data;
}

export async function getAssignmentsByUser(
  userId: number,
  params?: Record<string, any>,
) {
  return (
    await api.get(`/v1/documents/cuadro-firmas/by-user/${userId}`, {
      params,
    })
  ).data;
}

export async function getSupervisionDocs(params?: Record<string, any>) {
  return (
    await api.get(`/v1/documents/cuadro-firmas/documentos/supervision`, {
      params,
    })
  ).data;
}

export async function changeEstadoAsignacion(
  body: Api.UpdateEstadoAsignacionDto,
) {
  return (await api.patch(`/v1/documents/cuadro-firmas/estado`, body)).data;
}

export async function analyzePdfTest(file: File) {
  const fd = new FormData();
  fd.append("files", file);
  return (await api.post(`/v1/documents/analyze-pdf-test`, fd)).data as string;
}

export async function createPlantilla(body: Api.CreatePlantillaDto) {
  return (await api.post(`/v1/documents/plantilla`, body)).data;
}
