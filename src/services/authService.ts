import { api } from '@/lib/api';
import { setToken, clearToken } from '@/lib/tokenStore';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  const access = (res.data as any)?.access_token;
  if (access) setToken(access);
  return res.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    clearToken();
  }
}
