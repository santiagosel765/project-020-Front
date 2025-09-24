"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Loader2, Check, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { timeAgo } from "@/lib/time";
import type { UINotification } from "@/services/notificationsService";

export function NotificationBell() {
  const { currentUser } = useAuth();
  const {
    items,
    loading,
    loadingAction,
    unreadCount,
    markRead,
    markAllRead,
    error,
    fetch,
    shouldToastError,
  } = useNotifications();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const count = unreadCount;
  const badge = useMemo(() => {
    if (count <= 0) return null;
    return count > 99 ? "99+" : count.toString();
  }, [count]);

  useEffect(() => {
    if (error && shouldToastError(error)) {
      toast({ variant: "destructive", title: "Error", description: error });
    }
  }, [error, shouldToastError, toast]);

  useEffect(() => {
    if (open) {
      void fetch({ silent: true, userId: currentUser?.id ?? undefined });
    }
  }, [open, fetch, currentUser?.id]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    console.debug("[Notifications] dropdown", nextOpen ? "abierto" : "cerrado");
  };

  const handleMarkAll = async () => {
    if (!currentUser?.id || loadingAction || count === 0) return;
    const ok = await markAllRead();
    if (ok) {
      toast({ title: "Listo", description: "Notificaciones marcadas como leídas" });
    }
  };

  const handleRefresh = () => {
    void fetch({ userId: currentUser?.id ?? undefined });
  };

  const handleItemSelect = async (notification: UINotification) => {
    if (!currentUser?.id) return;
    let success = true;
    if (!notification.isRead) {
      success = await markRead(notification.id);
    }
    if (notification.href) {
      setOpen(false);
      router.push(notification.href);
    } else if (!success) {
      await fetch({ silent: true });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ver notificaciones"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          className="relative rounded-full"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {badge && (
            <span
              aria-label={`${badge} notificaciones sin leer`}
              className="absolute -right-0 -top-0 min-w-[1.25rem] rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground"
            >
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="z-[1000] w-96 overflow-hidden rounded-xl border bg-popover p-0 shadow-xl"
        sideOffset={8}
        id={menuId}
      >
        <div className="flex max-h-[60vh] flex-col" role="region" aria-live="polite">
          <div className="flex items-center justify-between px-4 py-3">
            <DropdownMenuLabel className="p-0 text-base">Notificaciones</DropdownMenuLabel>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={loadingAction || count === 0}
            >
              {loadingAction ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="mr-1 h-4 w-4" aria-hidden="true" />
              )}
              Marcar todas
            </Button>
          </div>
          <DropdownMenuSeparator />

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Cargando…</div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <p className="text-destructive">No se pudieron cargar las notificaciones.</p>
                <Button variant="link" size="sm" onClick={handleRefresh}>
                  Reintentar
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <p>Sin notificaciones</p>
                <Button variant="link" size="sm" onClick={handleRefresh}>
                  Actualizar
                </Button>
              </div>
            ) : (
              <ul className="py-1">
                {items.map((n) => (
                  <li key={n.id}>
                    <DropdownMenuItem
                      className="focus:bg-muted/60 data-[state=open]:bg-muted/60"
                      onSelect={(e) => {
                        e.preventDefault();
                        void handleItemSelect(n);
                      }}
                    >
                      <div className="flex items-start gap-3 py-1">
                        <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
                          {n.isRead ? <MailOpen className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${n.isRead ? "text-muted-foreground" : "font-medium"}`}>
                            {n.title}
                          </p>
                          {n.message ? (
                            <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <Badge className="shrink-0" aria-label="Notificación nueva">
                            Nuevo
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <Separator />
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <Link href="/notificaciones" className="text-xs text-primary underline underline-offset-2">
              Ver todas
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
