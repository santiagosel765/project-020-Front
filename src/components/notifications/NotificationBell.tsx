"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Loader2, Check, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  const count = unreadCount;
  const badge = useMemo(
    () => (count > 99 ? "99+" : count > 0 ? String(count) : null),
    [count],
  );

  useEffect(() => {
    if (error && shouldToastError(error)) {
      toast({ variant: "destructive", title: "Error", description: error });
    }
  }, [error, shouldToastError, toast]);

  useEffect(() => {
    if (currentUser?.id) {
      void fetch({ silent: true, userId: currentUser.id });
    }
  }, [currentUser?.id, fetch]);

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
      router.push(notification.href);
    } else if (!success) {
      await fetch({ silent: true });
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void fetch({ silent: true, userId: currentUser?.id });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Ver notificaciones"
          className="relative rounded-full pointer-events-auto"
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
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[1000] w-96 overflow-hidden rounded-xl border bg-popover p-0 shadow-xl"
      >
        <div className="flex max-h-[60vh] flex-col" role="region" aria-live="polite">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="p-0 text-base font-medium">Notificaciones</p>
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
            <Separator />

            <ScrollArea className="max-h-[50vh] min-h-[200px]">
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
                      <button
                        type="button"
                        className="w-full px-2 text-left hover:bg-muted/60 focus:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                        onClick={async () => {
                          setOpen(false);
                          await handleItemSelect(n);
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
                      </button>
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
      </PopoverContent>
    </Popover>
  );
}
