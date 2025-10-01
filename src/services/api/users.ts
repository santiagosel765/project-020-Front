import { api } from '@/lib/api';
import type { MeResponseDto } from '@/types/me';

export type UpdateMySignatureResponse = {
  url?: string;
  signatureUrl?: string;
};

export const getMe = () => api.get<MeResponseDto>('/users/me');

export const updateMySignature = (file: File | Blob) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.patch<UpdateMySignatureResponse>('/users/me/signature', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
