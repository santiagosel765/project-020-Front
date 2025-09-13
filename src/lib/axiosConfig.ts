import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, setToken, clearToken } from './tokenStore';

// Always proxy through Next.js API routes
const baseURL = '/api';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('[axios] baseURL =', baseURL);
  // @ts-ignore
  window.__AXIOS_BASE__ = baseURL;
}

/* ------------------------- Cliente Axios ------------------------- */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 600000, // 60s
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
  config: AxiosRequestConfig & { _retried?: boolean };
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

function isLogoutUrl(url?: string) {
  if (!url) return false;
  return /\/auth\/logout$/.test(url);
}

/* ------------------------- Interceptor de response ------------------------- */
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const toError = (err: any) => {
      const e: any = new Error(err?.message || 'Network error');
      e.isNetwork = !err?.response;
      e.status = err?.response?.status;
      e.payload = err?.response?.data;
      return e;
    };

    const original = (error.config || {}) as AxiosRequestConfig & { _retried?: boolean };

    const status = error.response?.status;
    const url = original.url || '';
    if (status === 401 && !original._retried && !isLogoutUrl(url)) {
      if (isRefreshUrl(url)) {
        clearToken();
        return Promise.reject(toError(error));
      }

      original._retried = true;

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
        // Refresh falló: limpia credenciales y rechaza
        clearToken();
        flushQueue(e, null);
        return Promise.reject(toError(e));
      } finally {
        isRefreshing = false;
      }
    }

    // Normaliza error de red / 5xx
    return Promise.reject(toError(error));
  }
);

export default api;
