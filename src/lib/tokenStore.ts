let accessToken: string | null = null;

const bc = typeof window !== 'undefined' ? new BroadcastChannel('auth') : null;

export function getToken() {
  return accessToken;
}

export function setToken(t: string | null) {
  accessToken = t;
}

export function clearToken() {
  accessToken = null;
  bc?.postMessage({ type: 'logout' });
}

bc?.addEventListener('message', (ev) => {
  if (ev.data?.type === 'logout') accessToken = null;
});
