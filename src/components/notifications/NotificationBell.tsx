'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Loader2, Check, MailOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/store/auth';
import { useNotifications } from '@/store/notifications';
import { timeAgo } from '@/lib/time';

export function NotificationBell() {
  const { currentUser } = useAuth();
  const { items, loading, unreadCount, markRead, markAllRead, error } = useNotifications();
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const count = unreadCount();
  const badge = useMemo(() => (count > 99 ? '99+' : count.toString()), [count]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
    }
  }, [error, toast]);

  const handleMarkAll = async () => {
    if (!currentUser?.id || busy || unreadCount() === 0) return;
    setBusy(true);
    try {
      await markAllRead(currentUser.id);
      toast({ title: 'Listo', description: 'Notificaciones marcadas como leídas' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e?.message ?? 'Ocurrió un error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative rounded-full">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span
              aria-label={`${count} notificaciones sin leer`}
              className="absolute -right-0 -top-0 min-w-[1.25rem] rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground"
            >
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0" sideOffset={8} role="region" aria-live="polite">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-base">Notificaciones</DropdownMenuLabel>
          <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={busy || count === 0}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="mr-1 h-4 w-4" aria-hidden="true" />}
            Marcar todas
          </Button>
        </div>
        <Separator />

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Cargando…</div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive">No se pudieron cargar las notificaciones.</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No hay notificaciones</div>
          ) : (
            <ul className="py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <DropdownMenuItem
                    className="focus:bg-muted/60 data-[state=open]:bg-muted/60"
                    onSelect={async (e) => {
                      e.preventDefault();
                      if (!n.isRead && currentUser?.id) {
                        try {
                          await markRead(currentUser.id, n.id);
                        } catch (err: any) {
                          toast({ variant: 'destructive', title: 'Error', description: err?.message ?? 'Ocurrió un error' });
                        }
                      }
                      if (n.href) {
                        router.push(n.href);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 py-1">
                      <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
                        {n.isRead ? <MailOpen className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${n.isRead ? 'text-muted-foreground' : 'font-medium'}`}>{n.title}</p>
                        {n.message ? <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p> : null}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
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

        <div className="flex items-center justify-end gap-2 p-2">
          <Link href="/notificaciones" className="text-xs text-primary underline underline-offset-2">
            Ver todas
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
