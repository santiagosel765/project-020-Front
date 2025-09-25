import { AxiosError } from "axios";

export type AppError = { status?: number; message: string; data?: any };

export type ListParams = {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  search?: string;
  includeInactive?: boolean;
};

export function buildListQuery(p: ListParams) {
  const params = new URLSearchParams();
  if (p.page) params.set("page", String(p.page));
  if (p.limit) params.set("limit", String(p.limit));
  if (p.sort) params.set("sort", p.sort);
  if (p.search?.trim()) params.set("search", p.search.trim());

  if (typeof p.includeInactive === "boolean") {
    params.set("includeInactive", String(p.includeInactive));
    params.set("all", p.includeInactive ? "1" : "0");
  }

  return params.toString();
}

export function parseAxiosError(err: unknown): AppError {
  const e = err as AxiosError<any>;
  return {
    status: e.response?.status,
    message: e.response?.data?.message ?? e.message ?? "Request error",
    data: e.response?.data,
  };
}
