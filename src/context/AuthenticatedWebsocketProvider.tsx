"use client";

import { useAuth } from "@/store/auth";
import { WebsocketProvider } from "@/context/WebsocketContext";
import React from "react";

export default function AuthenticatedWebsocketProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <>{children}</>;
  }

  return <WebsocketProvider>{children}</WebsocketProvider>;
}
