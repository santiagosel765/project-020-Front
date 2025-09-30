export async function getEmpresas(params?: { activo?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  const queryString = qs.toString();
  const url = queryString ? `/api/empresas?${queryString}` : "/api/empresas";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener empresas");
  return res.json() as Promise<{
    items: { id: number; nombre: string }[];
    total: number;
  }>;
}
