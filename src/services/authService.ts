import api from '@/lib/axiosConfig';
import { setToken, clearToken } from '@/lib/tokenStore';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { user: email, password });
  const access = res.data?.access_token;
  if (access) setToken(access);
  return res.data;
}

export async function logout() {
  clearToken();
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore
  }
}
