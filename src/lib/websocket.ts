import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function ensureSocket(): Socket {
  if (socket) return socket;
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 5000,
  });
  return socket;
}
