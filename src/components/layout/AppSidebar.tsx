"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import * as Lucide from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  id: string | number;
  nombre: string;
  url: string;
  icon?: string | null;
  order?: number | null;
  activo?: boolean | null;
  active?: boolean | null;
}

export interface AppSidebarUser {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface AppSidebarProps {
  items: SidebarItem[];
  user?: AppSidebarUser;
  isLoading?: boolean;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function LucideIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && (Lucide as Record<string, React.ComponentType<any>>)[name]) || Lucide.Square;
  return <Icon className={className} aria-hidden="true" />;
}

export function AppSidebar({ items, user, isLoading = false, isMobile = false, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
      return;
    }
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("sidebar:collapsed") : null;
    if (stored === "1") {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const handleToggle = () => {
    if (isMobile) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("sidebar:collapsed", next ? "1" : "0");
      }
      return next;
    });
  };

  const visibleItems = React.useMemo(() => {
    return items
      .filter((item) => (item.activo ?? item.active ?? true))
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
  }, [items]);

  const renderItem = (item: SidebarItem) => {
    const href = item.url || "/";
    const current = pathname === href || pathname?.startsWith(`${href}/`);
    const content = (
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground",
          isCollapsed && !isMobile && "justify-center px-2"
        )}
        aria-current={current ? "page" : undefined}
        aria-label={isCollapsed && !isMobile ? item.nombre : undefined}
        onClick={() => {
          onNavigate?.();
        }}
      >
        <LucideIcon name={item.icon ?? undefined} className="size-5" />
        {isCollapsed && !isMobile ? <span className="sr-only">{item.nombre}</span> : <span className="truncate">{item.nombre}</span>}
      </Link>
    );

    if (isCollapsed && !isMobile) {
      return (
        <Tooltip key={item.id} delayDuration={150}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" align="center">
            {item.nombre}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <React.Fragment key={item.id}>{content}</React.Fragment>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "flex h-[100dvh] flex-col gap-4 border-r border-border/60 bg-card/70 p-3 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60",
          isMobile ? "w-full rounded-none" : "rounded-r-2xl transition-[width] duration-300 ease-in-out",
          isCollapsed && !isMobile ? "w-[80px]" : "w-[260px]"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          <nav aria-label="Navegación principal" className="flex flex-col gap-1">
            {isLoading ? (
              <div className="flex flex-col gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2",
                      isCollapsed && !isMobile && "justify-center px-2"
                    )}
                  >
                    <Skeleton className="size-5 rounded-md" />
                    {!(isCollapsed && !isMobile) ? <Skeleton className="h-4 flex-1" /> : null}
                  </div>
                ))}
              </div>
            ) : (
              visibleItems.map((item) => renderItem(item))
            )}
          </nav>
        </div>
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-3 text-sm shadow-sm",
              isCollapsed && !isMobile ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "Usuario"} />
                <AvatarFallback>{initials(user?.name ?? user?.email ?? "")}</AvatarFallback>
              </Avatar>
              {!(isCollapsed && !isMobile) ? (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium leading-tight">{user?.name ?? "Usuario"}</span>
                  {user?.email ? (
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {!isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    onClick={handleToggle}
                  >
                    {isCollapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
                    <span className="sr-only">
                      {isCollapsed ? "Expandir menú" : "Colapsar menú"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  {isCollapsed ? "Expandir" : "Colapsar"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
