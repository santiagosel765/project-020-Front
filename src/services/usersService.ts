import api from '@/lib/axiosConfig';
import { Api } from '@/types/api';
import { normalizeList, normalizeOne } from '@/lib/apiEnvelope';

export async function createUser(body: Api.CreateUserDto) {
  const { data } = await api.post("/users", body);
  return normalizeOne<any>(data);
}

export async function getUsers() {
  const { data } = await api.get<Api.User[]>("/users");
  return normalizeList<Api.User>(data);
}

export async function getMe() {
  const { data } = await api.get("/users/me");
  return normalizeOne<{
    id: number;
    nombre: string;
    correo: string;
    pages: { id: number; nombre: string; url: string }[];
    roles: string[];
  }>(data);
}

export async function getUser(id: number) {
  const { data } = await api.get<Api.User>(`/users/${id}`);
  return normalizeOne<Api.User>(data);
}

export async function updateUser(
  id: number,
  body: Partial<Api.CreateUserDto>,
) {
  const { data } = await api.patch(`/users/${id}`, body);
  return normalizeOne<any>(data);
}

export async function deleteUser(id: number) {
  const { data } = await api.delete(`/users/${id}`);
  return normalizeOne<any>(data);
}
