import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, setToken, clearToken } from './tokenStore';

function normalizeBase(url?: string | null) {
  if (!url) return null;
  return url.replace(/\/+$/, ''); 
}

const ENV_BASE = normalizeBase(process.env.NEXT_PUBLIC_API_BASE || null);
const baseURL = ENV_BASE || 'http://localhost:3200/api/v1';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('[axios] baseURL =', baseURL);
  // @ts-ignore
  window.__AXIOS_BASE__ = baseURL;
}

/* ------------------------- Cliente Axios ------------------------- */
const api = axios.create({
  baseURL,
  withCredentials: true,           
  timeout: 15000,                 
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/* ------------------------- Interceptor de request ------------------------- */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------------------- Cola de reintentos durante refresh ------------------------- */
let isRefreshing = false;
let queue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig & { _retry?: boolean };
}> = [];

function flushQueue(error: any, token: string | null = null) {
  queue.forEach(({ resolve, reject, config }) => {
    if (error) return reject(error);
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    resolve(api(config));
  });
  queue = [];
}

function isRefreshUrl(url?: string) {
  if (!url) return false;
  return /\/auth\/refresh$/.test(url);
}

/* ------------------------- Interceptor de response ------------------------- */
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = (error.config || {}) as AxiosRequestConfig & { _retry?: boolean };

    const status = error.response?.status;
    if (status === 401 && !original._retry) {
      if (isRefreshUrl(original.url || '')) {
        clearToken();
        throw error;
      }

      original._retry = true;

      // Si ya hay un refresh en curso, encolamos esta request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config: original });
        });
      }

      // Disparamos el refresh (cookie HttpOnly via withCredentials)
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newAccess = (data as any)?.access_token;
        if (newAccess) setToken(newAccess);

        flushQueue(null, newAccess);

        // Reintenta la request original con el nuevo access
        if (newAccess) {
          original.headers = original.headers ?? {};
          (original.headers as any).Authorization = `Bearer ${newAccess}`;
        }
        return api(original);
      } catch (e) {
        clearToken();
        flushQueue(e, null);
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    // Puedes normalizar errores aquí si quieres una forma estándar
    throw error;
  }
);

export default api;
