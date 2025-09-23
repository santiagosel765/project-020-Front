'use client';

import { useSyncExternalStore } from 'react';
import { getNotificationsByUser, markNotificationAsRead, UINotification } from '@/services/notificationsService';

type State = {
  items: UINotification[];
  loading: boolean;
  error?: string | null;
};

type Actions = {
  fetch: (userId: number) => Promise<void>;
  markRead: (userId: number, id: number) => Promise<void>;
  markAllRead: (userId: number) => Promise<void>;
  unreadCount: () => number;
};

type Store = State & Actions;

const listeners = new Set<() => void>();

let state: State = {
  items: [],
  loading: false,
  error: null,
};
let serverSnapshot: Store | null = null;
let cachedSnapshot: Store;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(update: Partial<State> | ((prev: State) => State)) {
  state = typeof update === 'function' ? (update as (prev: State) => State)(state) : { ...state, ...update };
  cachedSnapshot = { ...state, ...actions };
  serverSnapshot = null;
  emit();
}

const actions: Actions = {
  async fetch(userId) {
    try {
      setState({ loading: true, error: null });
      const items = await getNotificationsByUser(userId);
      setState({ items, loading: false, error: null });
    } catch (error) {
      setState({ error: 'No se pudieron cargar las notificaciones', loading: false });
    }
  },

  async markRead(userId, id) {
    const prevItems = state.items;
    setState({ items: prevItems.map((n) => (n.id === id ? { ...n, isRead: true } : n)) });
    try {
      await markNotificationAsRead(userId, id);
    } catch (error) {
      setState({ items: prevItems });
      throw new Error('No se pudo marcar como leída');
    }
  },

  async markAllRead(userId) {
    const prevItems = state.items;
    const pending = prevItems.filter((n) => !n.isRead);
    if (pending.length === 0) return;
    setState({ items: prevItems.map((n) => ({ ...n, isRead: true })) });
    try {
      await Promise.all(pending.map((n) => markNotificationAsRead(userId, n.id)));
    } catch (error) {
      setState({ items: prevItems });
      await actions.fetch(userId);
      throw new Error('No se pudieron marcar todas');
    }
  },

  unreadCount() {
    return state.items.filter((n) => !n.isRead).length;
  },
};

cachedSnapshot = { ...state, ...actions };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Store {
  return cachedSnapshot;
}

function getServerSnapshot(): Store {
  if (!serverSnapshot) {
    serverSnapshot = cachedSnapshot;
  }
  return serverSnapshot;
}

export function useNotifications(): Store {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
