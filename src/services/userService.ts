import api from '@/lib/axiosConfig';

export interface User {
  roles?: string[];
  [key: string]: any;
}

export async function getMe(): Promise<User> {
  const res = await api.get('/users/me');
  return res.data;
}
