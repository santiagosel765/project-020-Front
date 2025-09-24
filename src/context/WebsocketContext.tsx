"use client";

import { useAuth } from "@/store/auth";
import { getSocket, closeSocket } from "@/lib/websocket";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Socket } from "socket.io-client";

const WebsocketContext = createContext<Socket | undefined>(undefined);

export const useWebsocket = () => useContext(WebsocketContext);

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();

  const socketRef = useRef<Socket | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setReady(false);
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log("Socket conectado:", socket.id);
      setReady(true);
    };
    const handleConnectError = (err: Error) => {
      console.error("Error de conexión socket.io:", err);
    };
    const handleDisconnect = (reason: string) => {
      console.log("Socket desconectado:", reason);
      setReady(false);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socketRef.current = undefined;
      closeSocket();
      setReady(false);
    };
  }, [currentUser?.id]);

  // Solo renderiza el contexto cuando el socket está listo
  return (
    <WebsocketContext.Provider value={socketRef.current}>
      {ready ? children : null}
    </WebsocketContext.Provider>
  );
};
