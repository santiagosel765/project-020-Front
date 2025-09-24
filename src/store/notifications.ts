'use client';

import { useSyncExternalStore } from 'react';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  UINotification,
} from '@/services/notificationsService';

type State = {
  items: UINotification[];
  loading: boolean;
  error?: string | null;
  _lastErrorAt?: number | null;
};

type Actions = {
  fetch: (userId: number) => Promise<void>;
  receiveFromWS: (payload: UINotification | UINotification[]) => void;
  markRead: (userId: number, id: number) => Promise<void>;
  markAllRead: (userId: number) => Promise<void>;
  unreadCount: () => number;
  shouldToastError: () => boolean;
};

type Store = State & Actions;

const listeners = new Set<() => void>();

let state: State = {
  items: [],
  loading: false,
  error: null,
  _lastErrorAt: null,
};
let serverSnapshot: Store | null = null;
let cachedSnapshot: Store;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(update: Partial<State> | ((prev: State) => State)) {
  state =
    typeof update === 'function'
      ? (update as (prev: State) => State)(state)
      : { ...state, ...update };
  cachedSnapshot = { ...state, ...actions };
  serverSnapshot = null;
  emit();
}

function sortNotifications(list: UINotification[]): UINotification[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function upsertNotifications(
  current: UINotification[],
  incoming: UINotification[],
): UINotification[] {
  const map = new Map<number, UINotification>();
  for (const item of current) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    const existing = map.get(item.id);
    map.set(item.id, existing ? { ...existing, ...item } : item);
  }
  return sortNotifications(Array.from(map.values()));
}

const actions: Actions = {
  async fetch(userId) {
    try {
      setState({ loading: true, error: null });
      const items = await getNotificationsByUser(userId);
      setState({
        items: sortNotifications(items),
        loading: false,
        error: null,
        _lastErrorAt: null,
      });
    } catch (error) {
      setState({
        loading: false,
        error: 'No se pudieron cargar las notificaciones',
      });
    }
  },

  receiveFromWS(payload) {
    const incoming = Array.isArray(payload) ? payload : [payload];
    if (incoming.length === 0) return;
    setState((prev) => ({
      ...prev,
      items: upsertNotifications(prev.items, incoming),
    }));
  },

  async markRead(userId, id) {
    const prevItems = state.items;
    const optimistic = prevItems.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    setState({ items: optimistic });
    try {
      await markNotificationAsRead(userId, id);
    } catch (error) {
      setState({ items: prevItems });
      throw new Error('No se pudo marcar la notificación como leída');
    }
  },

  async markAllRead(userId) {
    const prevItems = state.items;
    const pending = prevItems.filter((n) => !n.isRead);
    if (pending.length === 0) return;
    setState({
      items: prevItems.map((n) => (n.isRead ? n : { ...n, isRead: true })),
    });
    try {
      await Promise.all(
        pending.map((n) => markNotificationAsRead(userId, n.id)),
      );
    } catch (error) {
      setState({ items: prevItems });
      await actions.fetch(userId);
      throw new Error('No se pudieron marcar todas las notificaciones');
    }
  },

  unreadCount() {
    return state.items.filter((n) => !n.isRead).length;
  },

  shouldToastError() {
    const now = Date.now();
    if (!state._lastErrorAt || now - state._lastErrorAt > 60_000) {
      setState({ _lastErrorAt: now });
      return true;
    }
    return false;
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
