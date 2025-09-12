import { AxiosError } from "axios";

export type AppError = { status?: number; message: string; data?: any };

export function parseAxiosError(err: unknown): AppError {
  const e = err as AxiosError<any>;
  return {
    status: e.response?.status,
    message: e.response?.data?.message ?? e.message ?? "Request error",
    data: e.response?.data,
  };
}
