'use client';

import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/store/notifications';
import { useWebsocket } from '@/context/WebsocketContext';
import { adaptNotification } from '@/services/notificationsService';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const socket = useWebsocket();
  const { fetch, upsertFromSocket } = useNotifications();

  useEffect(() => {
    if (!currentUser?.id) return;
    void fetch({ userId: currentUser.id, page: 1, limit: 10 });

    const id = window.setInterval(() => {
      void fetch({ page: 1, limit: 10, silent: true });
    }, 30_000);

    const onFocus = () => {
      void fetch({ page: 1, limit: 10, silent: true });
    };

    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(id);
    };
  }, [currentUser?.id, fetch]);

  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    socket.emit('user-notifications-client', { userId: currentUser.id });

    const handleMessage = (payload: unknown) => {
      if (!payload) return;

      const rawItems = Array.isArray((payload as any)?.userNotifications)
        ? (payload as any).userNotifications
        : Array.isArray(payload)
          ? payload
          : [payload];

      const normalized = rawItems
        .map((item: unknown) => adaptNotification(item as Record<string, any>))
        .filter(Boolean);

      if (normalized.length > 0) {
        console.debug('[Notifications] Evento recibido (WS)', normalized.length);
        upsertFromSocket(normalized);
      }
    };

    socket.on('user-notifications-server', handleMessage);

    return () => {
      socket.off('user-notifications-server', handleMessage);
    };
  }, [socket, currentUser?.id, upsertFromSocket]);

  return <>{children}</>;
}
