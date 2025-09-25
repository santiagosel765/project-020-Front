"use client";

import * as React from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
    throw new Error("useSidebarSheet must be used within an AppLayout");
  }

  return context;
}

export function useOptionalSidebarSheet() {
  return React.useContext(SidebarSheetContext);
}

interface AppLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ sidebar, header, children, className }: AppLayoutProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = (event as MediaQueryList).matches;
      if (matches) {
        setIsOpen(false);
      }
    };

    handleChange(mediaQuery);
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

  return (
    <SidebarSheetContext.Provider value={contextValue}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[min(320px,90vw)] p-0 md:hidden">
          <div className="flex h-full flex-col overflow-y-auto">{sidebar}</div>
        </SheetContent>
      </Sheet>
      <div className={cn("grid min-h-screen w-full md:grid-cols-[240px_1fr]", className)}>
        <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
          {sidebar}
        </aside>
        <div className="flex min-h-screen flex-col bg-background">
          {header}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarSheetContext.Provider>
  );
}
