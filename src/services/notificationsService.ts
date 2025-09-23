'use client';

import axios from 'axios';

if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = '/api';
}

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

function adapt(n: BackendNotification): UINotification {
  return {
    id: Number(n.id ?? n.notificationId),
    title: String(n.titulo ?? n.title ?? 'Notificación'),
    message: n.descripcion ?? n.message ?? '',
    createdAt: String(n.fechaCreacion ?? n.createdAt ?? new Date().toISOString()),
    isRead: Boolean(n.estaLeida ?? n.read ?? n.isRead ?? false),
    href: n.url ?? n.href ?? undefined,
    icon: n.tipo ?? n.type ?? undefined,
  };
}

export async function getNotificationsByUser(userId: number): Promise<UINotification[]> {
  const { data } = await axios.get(`/v1/documents/cuadro-firmas/notificaciones/${userId}`);
  const arr = Array.isArray(data) ? data : data?.items ?? [];
  return arr.map(adapt);
}

export async function markNotificationAsRead(userId: number, notificationId: number): Promise<void> {
  await axios.patch(`/v1/documents/cuadro-firmas/notificaciones/leer`, { userId, notificationId });
}
