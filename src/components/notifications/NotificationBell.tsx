"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Loader2, Check, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/store/auth";
import { useNotifications } from "@/store/notifications";
import { timeAgo } from "@/lib/time";
import type { UINotification } from "@/services/notificationsService";
import { HeadlessPopover } from "@/components/ui/HeadlessPopover";

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
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    if (next) void fetch({ silent: true, userId: currentUser?.id });
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Ver notificaciones"
        className="relative rounded-full pointer-events-auto"
        data-testid="notification-bell"
        onClick={() => handleOpenChange(!open)}
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

      <HeadlessPopover
        open={open}
        onOpenChange={handleOpenChange}
        anchorRef={triggerRef}
        width={384}
        offset={8}
        className="z-[1000] w-96 overflow-hidden rounded-xl border bg-popover p-0 shadow-xl"
      >
        <div
          className="flex max-h-[min(70dvh,560px)] flex-col"
          role="region"
          aria-live="polite"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
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
          <div className="max-h-[min(70dvh,560px)] min-h-[200px] overflow-y-auto">
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
              <ul className="divide-y">
                {items.map((n) => {
                  const createdAgo = timeAgo(n.createdAt);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className="group grid w-full grid-cols-[32px,1fr,auto] items-start gap-3 rounded-lg px-4 py-3 text-left hover:bg-accent/50 focus:bg-accent/60 focus-visible:outline-none md:grid-cols-[36px,1fr,auto]"
                        onClick={async () => {
                          setOpen(false);
                          await handleItemSelect(n);
                        }}
                      >
                        <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
                          {n.isRead ? (
                            <MailOpen className="h-5 w-5 md:h-5 md:w-5" />
                          ) : (
                            <Bell className="h-5 w-5 md:h-5 md:w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`font-medium leading-snug break-words whitespace-normal hyphens-auto [overflow-wrap:anywhere] ${
                              n.isRead ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {n.title}
                          </p>
                          {n.message ? (
                            <p className="mt-1 text-sm text-muted-foreground leading-snug break-words whitespace-normal hyphens-auto [overflow-wrap:anywhere] md:line-clamp-2">
                              {n.message}
                            </p>
                          ) : null}
                          <time className="mt-1 block text-right text-xs text-muted-foreground md:hidden">
                            {createdAgo}
                          </time>
                        </div>

                        <div className="ml-2 flex shrink-0 items-start gap-2">
                          {!n.isRead ? (
                            <span
                              className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary"
                              aria-label="Sin leer"
                            />
                          ) : null}
                          <time className="hidden text-xs text-muted-foreground md:block">{createdAgo}</time>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="sticky bottom-0 z-10 border-t bg-background/80 px-4 py-2 text-right backdrop-blur">
            <Link href="/notificaciones" className="text-xs text-primary underline underline-offset-2">
              Ver todas
            </Link>
          </div>
        </div>
      </HeadlessPopover>
    </>
  );
}
