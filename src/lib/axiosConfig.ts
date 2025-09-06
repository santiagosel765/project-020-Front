import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getToken, setToken, clearToken } from './tokenStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token && prom.config.headers) {
        prom.config.headers.Authorization = `Bearer ${token}`;
      }
      prom.resolve(api(prom.config));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig });
        });
      }

      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newToken = (res.data as any)?.access_token;
        setToken(newToken);
        processQueue(null, newToken);
        if (originalConfig.headers) {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalConfig);
      } catch (refreshError) {
        clearToken();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
