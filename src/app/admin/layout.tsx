"use client";

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';

import { AuthGuard } from '@/components/auth-guard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SettingsDialog } from '@/components/settings-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { initials } from '@/lib/avatar';
import { useSession } from '@/lib/session';

import { LayoutShell } from '@/components/layout/LayoutShell';
import { TopBar } from '@/components/layout/TopBar';
import { type SidebarItem } from '@/components/layout/AppSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { me, isLoading, error, pages, signOut, isAdmin, isSupervisor, avatarUrl, displayName, email } = useSession();
  const { toast } = useToast();

  const userRole: 'admin' | 'supervisor' | null = isAdmin ? 'admin' : isSupervisor ? 'supervisor' : null;

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace('/');
      return;
    }
    if (userRole === 'supervisor' && pathname !== '/admin/supervision') {
      router.replace('/admin/supervision');
    }
  }, [isLoading, me, userRole, pathname, router]);

  useEffect(() => {
    if (error) {
      const status = (error as any)?.status;
      if (status === 401) {
        router.replace('/');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la sesión' });
      }
    }
  }, [error, router, toast]);

  const adminPages = pages.filter((p: any) => p.path?.startsWith('/admin'));
  const sortedAdminPages = [...adminPages].sort(
    (a: any, b: any) => (a.order ?? a.id) - (b.order ?? b.id)
  );

  const sidebarItems: SidebarItem[] = sortedAdminPages.map((p: any) => ({
    id: p.id,
    nombre: p.name ?? p.nombre ?? 'Sin título',
    url: p.path ?? p.url ?? '#',
    icon: p.icon ?? undefined,
    order: p.order ?? undefined,
    activo: (p.activo ?? p.active ?? true) as boolean,
  }));

  const getPageTitle = () => {
    if (userRole === 'supervisor') return 'Supervisión';
    const current = sortedAdminPages.find((page: any) => pathname.startsWith(page.path));
    return current?.name ?? current?.nombre ?? 'Dashboard';
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
    router.replace('/');
  };

  const headerActions = (
    <div className="flex items-center gap-4">
      <NotificationBell />
      <SettingsDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={(avatarUrl as string | undefined) ?? (me?.avatarUrl as string | undefined)} alt={displayName ?? 'Usuario'} data-ai-hint="person avatar" />
                <AvatarFallback>{initials(displayName ?? me?.nombre ?? (userRole ?? ''))}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p>{displayName ?? me?.nombre ?? (userRole === 'admin' ? 'Administrador' : 'Supervisor')}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {email ?? me?.correo ?? (userRole === 'admin' ? 'admin@zignosign.com' : 'supervisor@zignosign.com')}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <SettingsDialog.Trigger asChild>
                <div className="w-full cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </div>
              </SettingsDialog.Trigger>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SettingsDialog>
    </div>
  );

  if (isLoading || !userRole) return null;

  return (
    <AuthGuard roles={['ADMIN', 'SUPERVISOR']}>
      {userRole === 'supervisor' ? (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <TopBar title={getPageTitle()} actions={headerActions} showMenuButton={false} />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
        </div>
      ) : (
        <LayoutShell
          sidebar={{
            items: sidebarItems,
            user: {
              name: displayName ?? me?.nombre ?? undefined,
              email: email ?? me?.correo ?? undefined,
              avatarUrl: (avatarUrl as string | undefined) ?? (me?.avatarUrl as string | undefined) ?? undefined,
            },
            isLoading,
          }}
          topBar={{
            title: getPageTitle(),
            actions: headerActions,
            showMenuButton: true,
          }}
        >
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</div>
        </LayoutShell>
      )}
    </AuthGuard>
  );
}
