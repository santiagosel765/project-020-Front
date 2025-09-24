'use client';

import { api } from '@/lib/api';

export type BackendNotification = Record<string, any>;
export type UINotification = {
  id: number;
  title: string;
  message?: string;
  createdAt: string;
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
        n.updated_at ??
        n.created_at ??
        new Date().toISOString(),
    ),
    isRead: Boolean(n.estaLeida ?? n.read ?? n.isRead ?? n.leida ?? false),
    href: n.url ?? n.href ?? n.referencia_url ?? undefined,
    icon: n.tipo ?? n.type ?? undefined,
  };
}

export async function getNotificationsByUser(userId: number): Promise<UINotification[]> {
  const response = await api.get<unknown>(
    `/v1/documents/cuadro-firmas/notificaciones/${userId}`,
  );
  const payload = response.data as any;
  const arr = Array.isArray(payload) ? payload : payload?.items ?? [];
  return arr.map(adaptNotification);
}

export async function markNotificationAsRead(userId: number, notificationId: number): Promise<void> {
  await api.patch(`/v1/documents/cuadro-firmas/notificaciones/leer`, { userId, notificationId });
}
