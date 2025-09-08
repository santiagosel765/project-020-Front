import api from '@/lib/axiosConfig';

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>('/users/me');
  return res.data;
}
