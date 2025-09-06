import api from '@/lib/axiosConfig';

export async function signDocument(formData: FormData) {
  const res = await api.post('/documents/sign', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
