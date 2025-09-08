let accessToken: string | null = null;

const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('auth')
  : null;

type TokenEvent =
  | { type: 'set'; token: string }
  | { type: 'clear' }
  | { type: 'logout' };

export function getToken() {
  return accessToken;
}

export function setToken(t: string | null) {
  accessToken = t;
  if (t && bc) bc.postMessage({ type: 'set', token: t } as TokenEvent);
}

export function clearToken() {
  accessToken = null;
  if (bc) bc.postMessage({ type: 'clear' } as TokenEvent);
}

export function broadcastLogout() {
  if (bc) bc.postMessage({ type: 'logout' } as TokenEvent);
}

export function onTokenBroadcast(cb: (evt: TokenEvent) => void) {
  if (!bc) return () => {};
  const handler = (e: MessageEvent<TokenEvent>) => cb(e.data);
  bc.addEventListener('message', handler);
  return () => bc.removeEventListener('message', handler);
}
