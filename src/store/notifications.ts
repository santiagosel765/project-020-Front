'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  NotificationFetchOptions,
  UINotification,
} from '@/services/notificationsService';

const MAX_NOTIFICATIONS = 50;

type State = {
  items: UINotification[];
  loading: boolean;
  loadingAction: boolean;
  error: string | null;
  userId?: number | null;
  _lastErrorAt?: number | null;
  _lastErrorMessage?: string | null;
};

type Actions = {
  fetch: (options?: FetchOptions) => Promise<void>;
  upsertFromSocket: (payload: UINotification | UINotification[]) => void;
  markRead: (id: number) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  shouldToastError: (message?: string | null) => boolean;
};

type Snapshot = State & Actions;

type Store = Snapshot & { unreadCount: number };

type FetchOptions = NotificationFetchOptions & {
  userId?: number;
  silent?: boolean;
};

const listeners = new Set<() => void>();

let state: State = {
  items: [],
  loading: false,
  loadingAction: false,
  error: null,
  userId: null,
  _lastErrorAt: null,
  _lastErrorMessage: null,
};
let serverSnapshot: Snapshot | null = null;
let cachedSnapshot: Snapshot;

function hasStateChanged(prev: State, next: State): boolean {
  if (prev === next) return false;
  const keys = new Set([
    ...Object.keys(prev) as (keyof State)[],
    ...Object.keys(next) as (keyof State)[],
  ]);
  for (const key of keys) {
    if (!Object.is(prev[key], next[key])) return true;
  }
  return false;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(update: Partial<State> | ((prev: State) => State)) {
  const nextState =
    typeof update === 'function'
      ? (update as (prev: State) => State)(state)
      : { ...state, ...update };
  if (!hasStateChanged(state, nextState)) {
    return;
  }
  state = nextState;
  cachedSnapshot = { ...state, ...actions };
  serverSnapshot = null;
  emit();
}

function sortNotifications(list: UINotification[]): UINotification[] {
  return [...list]
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bDate = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bDate - aDate;
    })
    .slice(0, MAX_NOTIFICATIONS);
}

function areNotificationsEqual(a: UINotification, b: UINotification): boolean {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.message === b.message &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt &&
    a.isRead === b.isRead &&
    a.href === b.href &&
    a.icon === b.icon
  );
}

function mergeNotifications(
  current: UINotification[],
  incoming: UINotification[],
): { next: UINotification[]; changed: boolean } {
  if (incoming.length === 0 && current.length === 0) {
    return { next: current, changed: false };
  }
  const map = new Map<number, UINotification>();
  for (const item of current) {
    map.set(item.id, item);
  }
  let changed = false;
  for (const rawItem of incoming) {
    const item = { ...rawItem, id: Number(rawItem.id) };
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      changed = true;
      continue;
    }
    const merged = { ...existing, ...item };
    if (!areNotificationsEqual(existing, merged)) {
      map.set(item.id, merged);
      changed = true;
    }
  }
  const ordered = sortNotifications(Array.from(map.values()));
  if (!changed && ordered.length !== current.length) {
    changed = true;
  }
  if (!changed) {
    for (let i = 0; i < ordered.length; i += 1) {
      if (!areNotificationsEqual(ordered[i], current[i]!)) {
        changed = true;
        break;
      }
    }
  }
  return { next: ordered, changed };
}

const actions: Actions = {
  async fetch(options = {}) {
    const userId = options.userId ?? state.userId ?? undefined;
    if (!userId) return;
    if (!options.silent) {
      setState({ loading: true, error: null, userId });
    } else {
      setState({ userId });
    }
    try {
      const items = await getNotificationsByUser(userId, {
        page: options.page,
        limit: options.limit,
      });
      setState((prev) => {
        const { next, changed } = mergeNotifications(prev.items, items);
        if (!changed) {
          return {
            ...prev,
            loading: false,
            error: null,
            _lastErrorAt: null,
            _lastErrorMessage: null,
          };
        }
        return {
          ...prev,
          items: next,
          loading: false,
          error: null,
          _lastErrorAt: null,
          _lastErrorMessage: null,
        };
      });
    } catch (error) {
      setState({
        loading: false,
        error: 'No se pudieron cargar las notificaciones',
      });
    }
  },

  upsertFromSocket(payload) {
    const incoming = Array.isArray(payload) ? payload : [payload];
    if (incoming.length === 0) return;
    setState((prev) => {
      const { next, changed } = mergeNotifications(prev.items, incoming);
      if (!changed) {
        return prev;
      }
      return { ...prev, items: next };
    });
  },

  async markRead(id) {
    const userId = state.userId ?? undefined;
    if (!userId) return false;
    const prevItems = state.items;
    const optimistic = prevItems.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    setState({ items: optimistic });
    try {
      await markNotificationAsRead(userId, id);
      return true;
    } catch (error) {
      setState({
        items: prevItems,
        error: 'No se pudo marcar la notificación como leída',
      });
      return false;
    }
  },

  async markAllRead() {
    const userId = state.userId ?? undefined;
    if (!userId) return false;
    const prevItems = state.items;
    const pending = prevItems.filter((n) => !n.isRead);
    if (pending.length === 0) return true;
    setState({
      items: prevItems.map((n) => (n.isRead ? n : { ...n, isRead: true })),
      loadingAction: true,
    });
    try {
      await Promise.all(
        pending.map((n) => markNotificationAsRead(userId, n.id)),
      );
      setState({ loadingAction: false });
      return true;
    } catch (error) {
      setState({ items: prevItems, loadingAction: false });
      await actions.fetch({ silent: true });
      setState({
        error: 'No se pudieron marcar todas las notificaciones',
      });
      return false;
    }
  },

  shouldToastError(message) {
    if (!message) return false;
    const now = Date.now();
    const sameMessage = state._lastErrorMessage === message;
    if (sameMessage && state._lastErrorAt && now - state._lastErrorAt < 60_000) {
      return false;
    }
    setState({ _lastErrorAt: now, _lastErrorMessage: message });
    return true;
  },
};

cachedSnapshot = { ...state, ...actions };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  return cachedSnapshot;
}

function getServerSnapshot(): Snapshot {
  if (!serverSnapshot) {
    serverSnapshot = cachedSnapshot;
  }
  return serverSnapshot;
}

export function useNotifications(): Store {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => snapshot.items, [snapshot.items]);
  const unreadCount = useMemo(
    () => items.reduce((acc, item) => (item.isRead ? acc : acc + 1), 0),
    [items],
  );
  return useMemo(
    () => ({
      ...snapshot,
      items,
      unreadCount,
    }),
    [snapshot, items, unreadCount],
  );
}
