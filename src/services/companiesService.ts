import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Empresa = {
  id: number;
  nombre: string;
  activo?: boolean;
  logo?: string;
};

type EmpresasApiResponse =
  | {
      items?: Array<{
        id?: number | string | null;
        nombre?: string | null;
        activo?: boolean | number | null;
        logo?: string | null;
      }>;
      total?: number | null;
    }
  | Array<{
      id?: number | string | null;
      nombre?: string | null;
      activo?: boolean | number | null;
      logo?: string | null;
    }>;

export async function getEmpresas(
  params?: { activo?: boolean },
): Promise<{ items: Empresa[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (typeof params?.activo === "boolean") {
    searchParams.set("activo", String(params.activo));
  }

  const queryString = searchParams.toString();
  const url = queryString.length > 0 ? `/v1/empresas?${queryString}` : "/v1/empresas";

  const { data } = await api.get<EmpresasApiResponse>(url);
  const payload = data as EmpresasApiResponse;

  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
    ? payload.items
    : [];

  const items: Empresa[] = rawItems
    .map((empresa) => {
      const rawId = empresa?.id;
      const id = typeof rawId === "number" ? rawId : Number(rawId);
      if (!Number.isFinite(id)) return null;

      const nombre = typeof empresa?.nombre === "string" ? empresa.nombre.trim() : "";
      if (!nombre) return null;

      const rawActivo = empresa?.activo;
      const activo =
        typeof rawActivo === "boolean"
          ? rawActivo
          : typeof rawActivo === "number"
          ? Boolean(rawActivo)
          : undefined;

      const logo = typeof empresa?.logo === "string" && empresa.logo.trim() !== "" ? empresa.logo : undefined;

      return {
        id,
        nombre,
        activo,
        logo,
      } satisfies Empresa;
    })
    .filter((empresa): empresa is Empresa => empresa !== null);

  const total =
    !Array.isArray(payload) && typeof payload?.total === "number" && Number.isFinite(payload.total)
      ? (payload.total as number)
      : items.length;

  return { items, total };
}

export function useCompanies(params?: { activo?: boolean }) {
  const query = useQuery({
    queryKey: ["empresas", params],
    queryFn: () => getEmpresas(params),
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
