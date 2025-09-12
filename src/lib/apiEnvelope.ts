export type ApiEnvelope<T> = T | { status: number; data: T };

type AnyList<T> =
  | T[]
  | ApiEnvelope<T[]>
  | { items?: T[] }
  | { rows?: T[] }
  | null
  | undefined;

/** Devuelve el "payload real" desde un sobre {status,data} o desde el valor directo */
export function unwrap<T>(input: ApiEnvelope<T>): T {
  if (input && typeof input === 'object' && 'status' in input && 'data' in input) {
    // @ts-ignore
    return (input as any).data as T;
  }
  return input as T;
}

/** Convierte diferentes formas de listas a [] consistente */
export function toArray<T>(input: AnyList<T>): T[] {
  if (Array.isArray(input)) return input;
  if (!input) return [];
  // si vino como {status,data}
  const unwrapped = 'status' in (input as any) && 'data' in (input as any) ? unwrap(input as any) : input;
  if (Array.isArray(unwrapped)) return unwrapped;
  if (Array.isArray((unwrapped as any)?.items)) return (unwrapped as any).items;
  if (Array.isArray((unwrapped as any)?.rows)) return (unwrapped as any).rows;
  return [];
}

/**
 * Normaliza respuestas "especiales" del backend:
 * - 200 + {status:200,data:T} -> T
 * - 200 + {status:400,data:string} en endpoints de lista -> []
 * - 200 + {status:400,data:any} para endpoints NO lista -> lanza error
 */
export function normalizeList<T>(input: any): T[] {
  // Caso directo array / formas comunes
  const arr = toArray<T>(input);
  if (arr.length) return arr;

  // Caso sobre {status,data}
  if (input && typeof input === 'object' && 'status' in input && 'data' in input) {
    const env = input as { status: number; data: unknown };
    if (env.status >= 400) {
      // Si data es string tipo "No hay ..." tratamos como lista vacía (no es error fatal)
      if (typeof env.data === 'string') return [];
      // si no, re-lanzar para manejar arriba (toast, etc.)
      const err: any = new Error(typeof env.data === 'string' ? env.data : 'Error de negocio');
      err.isApiError = true;
      err.status = env.status;
      err.payload = env.data;
      throw err;
    }
    // status ok, devolver data como lista si aplica
    return toArray<T>(env.data as any);
  }

  return [];
}

export function normalizeOne<T>(input: any): T {
  if (input && typeof input === 'object' && 'status' in input && 'data' in input) {
    const env = input as { status: number; data: unknown };
    if (env.status >= 400) {
      const err: any = new Error(typeof env.data === 'string' ? env.data : 'Error de negocio');
      err.isApiError = true;
      err.status = env.status;
      err.payload = env.data;
      throw err;
    }
    return env.data as T;
  }
  return input as T;
}
