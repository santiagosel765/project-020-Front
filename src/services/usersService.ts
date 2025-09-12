import api from "./axiosConfig";
import { Api } from "@/types/api";

export async function createUser(body: Api.CreateUserDto) {
  return (await api.post("/v1/users", body)).data;
}

export async function getUsers() {
  return (await api.get<Api.User[]>("/v1/users")).data;
}

export async function getMe() {
  return (
    await api.get("/v1/users/me")
  ).data as {
    id: number;
    nombre: string;
    correo: string;
    pages: { id: number; nombre: string; url: string }[];
    roles: string[];
  };
}

export async function getUser(id: number) {
  return (await api.get<Api.User>(`/v1/users/${id}`)).data;
}

export async function updateUser(
  id: number,
  body: Partial<Api.CreateUserDto>,
) {
  return (await api.patch(`/v1/users/${id}`, body)).data;
}

export async function deleteUser(id: number) {
  return (await api.delete(`/v1/users/${id}`)).data;
}
