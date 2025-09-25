"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useOptionalSidebarSheet } from "./AppLayout";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
  showMenuButton?: boolean;
}

export function Header({
  className,
  children,
  actions,
  showMenuButton = true,
  ...props
}: HeaderProps) {
  const sheet = useOptionalSidebarSheet();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 md:px-6",
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
      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        {children}
      </div>
      {actions ? <div className="flex items-center gap-4">{actions}</div> : null}
    </header>
  );
}
