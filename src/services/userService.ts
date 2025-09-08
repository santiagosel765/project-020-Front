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

let mePromise: Promise<User> | null = null;
export function getMeOnce(): Promise<User> {
  if (mePromise) return mePromise;
  mePromise = getMe().finally(() => {
    mePromise = null;
  });
  return mePromise;
}
