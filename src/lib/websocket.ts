import { io, Socket } from 'socket.io-client';
import { getToken, subscribeTokenChanges } from '@/lib/tokenStore';

let socket: Socket | null = null;
let unsubscribeTokenChanges: (() => void) | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    transports: ['websocket'],
    withCredentials: true,
    auth: { token: getToken() || '' },
    autoConnect: true,
  });

  unsubscribeTokenChanges = subscribeTokenChanges((newToken) => {
    if (!socket) return;
    socket.auth = { token: newToken || '' };
    if (socket.connected) socket.disconnect();
    socket.connect();
  });

  return socket;
}

export function closeSocket() {
  if (unsubscribeTokenChanges) {
    unsubscribeTokenChanges();
    unsubscribeTokenChanges = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
}
