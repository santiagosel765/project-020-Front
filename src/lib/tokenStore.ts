let accessToken: string | null = null;

const listeners = new Set<(token: string | null) => void>();

const bc = typeof window !== 'undefined' ? new BroadcastChannel('auth') : null;

function notify(token: string | null) {
  listeners.forEach((listener) => listener(token));
}

export function getToken() {
  return accessToken;
}

export function setToken(t: string | null) {
  accessToken = t;
  notify(accessToken);
}

export function clearToken() {
  accessToken = null;
  notify(accessToken);
  bc?.postMessage({ type: 'logout' });
}

export function subscribeTokenChanges(listener: (token: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

bc?.addEventListener('message', (ev) => {
  if (ev.data?.type === 'logout') {
    accessToken = null;
    notify(accessToken);
  }
});
