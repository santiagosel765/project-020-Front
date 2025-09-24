"use client";

import Cookies from 'js-cookie';
import { useAuth } from "@/store/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

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
      console.log("Usuario no autenticado");
      if(socketRef.current) {
        socketRef.current = undefined;
      }
      setReady(false);
      return;
    }
    
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3200",
      {
        transports: ["websocket"],
        withCredentials: true,
      }
    );


    const socket = socketRef.current;
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket conectado:", socket.id);
        setReady(true);
      });
      socket.on("connect_error", (err) => {
        console.error("Error de conexión socket.io:", err);
      });
      socket.on("disconnect", (reason) => {
        console.log("Socket desconectado:", reason);
      });
    }

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.disconnect();
      }
      setReady(false);
    };
  }, []);

  // Solo renderiza el contexto cuando el socket está listo
  return (
    <WebsocketContext.Provider value={socketRef.current}>
      {ready ? children : null}
    </WebsocketContext.Provider>
  );
};
