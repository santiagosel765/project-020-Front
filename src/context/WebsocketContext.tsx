"use client";

import { ensureSocket } from "@/lib/websocket";
import { getAccessToken, subscribeTokenChanges } from "@/lib/tokenStore";
import React, { createContext, useContext, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

const WebsocketContext = createContext<Socket | undefined>(undefined);

export const useWebsocket = () => useContext(WebsocketContext);

export const WebsocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const mounted = useRef(false);
  const socketRef = useRef<Socket>(ensureSocket());

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const s = socketRef.current;

    const onConnect = () => console.log("Socket conectado:", s.id);
    const onDisconnect = (reason: string) =>
      console.log("Socket desconectado:", reason);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    const tryConnect = () => {
      const token = getAccessToken();
      if (!token) return;
      s.auth = { token };
      if (!s.connected) s.connect();
    };

    tryConnect();

    const unsub = subscribeTokenChanges((newToken) => {
      if (!newToken) return;
      s.auth = { token: newToken };
      if (s.connected) s.disconnect();
      s.connect();
    });

    return () => {
      unsub?.();
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <WebsocketContext.Provider value={socketRef.current}>
      {children}
    </WebsocketContext.Provider>
  );
};
