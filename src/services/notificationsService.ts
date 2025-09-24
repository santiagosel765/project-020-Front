'use client';

import { api } from '@/lib/api';

export type BackendNotification = Record<string, any>;
export type UINotification = {
  id: number;
  title: string;
  message?: string;
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
  href?: string;
  icon?: string;
};

export function adaptNotification(n: BackendNotification): UINotification {
  return {
    id: Number(n.id ?? n.notificationId),
    title: String(n.titulo ?? n.title ?? 'Notificación'),
    message: n.descripcion ?? n.message ?? n.contenido ?? '',
    createdAt: String(
      n.fechaCreacion ??
        n.createdAt ??
        n.add_date ??
        n.created_at ??
        n.updated_at ??
        new Date().toISOString(),
    ),
    updatedAt: n.fechaActualizacion ??
      n.updatedAt ??
      n.update_date ??
      n.updated_at ??
      undefined,
    isRead: Boolean(n.estaLeida ?? n.read ?? n.isRead ?? n.leida ?? false),
    href: n.url ?? n.href ?? n.referencia_url ?? undefined,
    icon: n.tipo ?? n.type ?? undefined,
  };
}

export type NotificationFetchOptions = {
  page?: number;
  limit?: number;
};

export async function getNotificationsByUser(
  userId: number,
  options: NotificationFetchOptions = {},
): Promise<UINotification[]> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.limit) params.set("limit", String(options.limit));
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const response = await api.get<unknown>(
    `/documents/cuadro-firmas/notificaciones/${userId}${query}`,
  );
  const payload = response.data as any;
  const arr =
    Array.isArray(payload)
      ? payload
      : payload?.data?.items ?? payload?.items ?? [];
  return arr.map(adaptNotification);
}

export async function markNotificationAsRead(userId: number, notificationId: number): Promise<void> {
  await api.patch(`/documents/cuadro-firmas/notificaciones/leer`, { userId, notificationId });
}
