// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3200/api/v1';

function withAuth(init?: RequestInit): RequestInit {
  if (typeof window === 'undefined') return init ?? {};
  const token = localStorage.getItem('access_token');
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  return { ...init, headers };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, withAuth(init));
  if (!res.ok) {
    // intenta parsear error del backend
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {}
    // si es 401, limpia tokens
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    throw new Error(message);
  }
  // si no hay body (204), evita .json()
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Utils opcionales
export function saveTokens(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Decodificar el payload del JWT (sin verificar firma) para leer roles rápidamente
export function decodeJwt<T = any>(token?: string | null): T | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
