"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AppLogo } from "./AppLogo";
import { useOptionalSidebarSheet } from "./LayoutShell";

export interface TopBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
  showMenuButton?: boolean;
}

export function TopBar({
  className,
  title,
  actions,
  showMenuButton = true,
  ...props
}: TopBarProps) {
  const sheet = useOptionalSidebarSheet();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/80 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-16 md:px-6",
        className
      )}
      {...props}
    >
      {showMenuButton ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => sheet?.openSidebar()}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      ) : (
        <div className="hidden h-10 w-10 shrink-0 md:hidden" aria-hidden="true" />
      )}
      <AppLogo className="shrink-0" />
      {title ? (
        <div className="flex min-w-0 flex-1 items-center">
          <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
            {title}
          </h1>
        </div>
      ) : (
        <div className="flex flex-1" />
      )}
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
