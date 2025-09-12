import api from '@/lib/axiosConfig';
import { normalizeOne } from '@/lib/apiEnvelope';

export async function pingAI() {
  const { data } = await api.get<string>("/ai");
  return normalizeOne<string>(data);
}
