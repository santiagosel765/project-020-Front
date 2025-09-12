import api from "./axiosConfig";

export async function pingAI() {
  return (await api.get<string>("/v1/ai")).data;
}
