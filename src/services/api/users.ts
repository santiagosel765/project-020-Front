import api from '@/lib/axiosConfig';

export const getMe = () => api.get('/users/me');

export const updateMySignature = (file: File | Blob) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.patch('/users/me/signature', fd);
};
