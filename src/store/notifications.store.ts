import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { persist } from "zustand/middleware";
interface Notification {
  add_date: string;
  contenido: string;
  id: number;
  referencia_id: number;
  referencia_tipo: string;
  tipo: string;
  titulo: string;
  updated_at: string;
}

interface UserNotifications {
  userNotifications: Notification[];
  totalNotificaciones: number;
}

interface NotificationsStore {
  userNotifications: UserNotifications;
  subscribeToSocket: (socket: Socket | null) => void;
  disconnectFromSocket: (socket: Socket | null) => void
  emitToSocket: (
    socket: Socket | null,
    message: string,
    payload: { [key: string]: any }
  ) => void;
}

export const useNotificationsStore = create(
  persist<NotificationsStore>(
    (set) => ({
      userNotifications: {
        userNotifications: [],
        totalNotificaciones: 0,
      },
      subscribeToSocket: (socket) => {
        if (!socket) return;
        socket.on("user-notifications-server", (data) => {
          set({
            userNotifications: data ?? {
              userNotifications: [],
              totalNotificaciones: 0,
            },
          });
        });
      },
      emitToSocket: (socket, message, payload = {}) => {
        if (!socket) return;
        socket.emit(message, payload);
      },
      disconnectFromSocket: (socket: Socket | null) => {
        if (!socket) return;
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      },
    }),
    {
      name: "notifications-store", // unique name for storage key
    }
  )
);
