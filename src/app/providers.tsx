"use client";

import * as React from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import AuthenticatedWebsocketProvider from "@/context/AuthenticatedWebsocketProvider";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { ReactQueryProvider } from "@/lib/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthenticatedWebsocketProvider>
        <TooltipProvider delayDuration={250}>
          <NotificationsProvider>{children}</NotificationsProvider>
        </TooltipProvider>
      </AuthenticatedWebsocketProvider>
    </ReactQueryProvider>
  );
}
