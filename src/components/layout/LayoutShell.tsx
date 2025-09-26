"use client";

import * as React from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { AppSidebar, type AppSidebarProps } from "./AppSidebar";
import { TopBar, type TopBarProps } from "./TopBar";

interface SidebarSheetContextValue {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarSheetContext = React.createContext<SidebarSheetContextValue | null>(null);

export function useSidebarSheet() {
  const context = React.useContext(SidebarSheetContext);

  if (!context) {
    throw new Error("useSidebarSheet must be used within a LayoutShell");
  }

  return context;
}

export function useOptionalSidebarSheet() {
  return React.useContext(SidebarSheetContext);
}

interface LayoutShellProps {
  sidebar: AppSidebarProps;
  topBar: TopBarProps;
  children: React.ReactNode;
  className?: string;
}

export function LayoutShell({ sidebar, topBar, children, className }: LayoutShellProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setIsOpen(false);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const contextValue = React.useMemo<SidebarSheetContextValue>(() => ({
    isOpen,
    setOpen: setIsOpen,
    openSidebar: () => setIsOpen(true),
    closeSidebar: () => setIsOpen(false),
    toggleSidebar: () => setIsOpen((prev) => !prev),
  }), [isOpen]);

  const handleNavigate = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SidebarSheetContext.Provider value={contextValue}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[18rem] p-0 md:hidden">
          <div className="flex h-full flex-col overflow-y-auto">
            <AppSidebar {...sidebar} isMobile onNavigate={handleNavigate} />
          </div>
        </SheetContent>
      </Sheet>
      <div className={cn("relative flex min-h-[100dvh] bg-muted/40", className)}>
        <div className="sticky top-0 hidden h-[100dvh] shrink-0 md:flex">
          <AppSidebar {...sidebar} onNavigate={handleNavigate} />
        </div>
        <div className="flex min-h-[100dvh] flex-1 flex-col bg-background">
          <TopBar {...topBar} />
          <main className="min-h-[100dvh] overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarSheetContext.Provider>
  );
}
