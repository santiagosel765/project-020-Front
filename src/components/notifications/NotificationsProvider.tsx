'use client';

import { useEffect } from 'react';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/store/notifications';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { fetch } = useNotifications();

  useEffect(() => {
    if (!currentUser?.id) return;
    void fetch(currentUser.id);
    const id = setInterval(() => {
      void fetch(currentUser.id);
    }, 30_000);
    const onFocus = () => {
      void fetch(currentUser.id);
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.id, fetch]);

  return <>{children}</>;
}
