"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileIcon,
  FilePlus2,
  FileText,
  FolderKanban,
  Key,
  LogOut,
  PanelLeft,
  Settings,
  ShieldCheck,
  ShieldIcon,
  Users,
} from 'lucide-react';

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

import { AppLayout, useSidebarSheet } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@/components/layout/Sidebar';

type AdminRoute = {
  key: string;
  label: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

interface AdminSidebarProps {
  routes: AdminRoute[];
  pathname: string;
  isLoading: boolean;
  onNavigate: (href: string) => void;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  const iconMap: Record<string, any> = {
    FilePlus2,
    FolderKanban,
    FileText,
    Users,
    Key,
    FileIcon,
    ShieldIcon,
    ShieldCheck,
  };

  const adminPages = pages.filter((p: any) => p.path.startsWith('/admin'));
  const routes: AdminRoute[] = adminPages
    .sort((a: any, b: any) => (a.order ?? a.id) - (b.order ?? b.id))
    .map((p: any) => ({
      key: p.id,
      label: p.name,
      href: p.path,
      Icon: p.icon && iconMap[p.icon] ? iconMap[p.icon] : FileText,
    }));

  const getPageTitle = () => {
    if (userRole === 'supervisor') return 'Supervisión';
    return routes.find((r: any) => pathname.startsWith(r.href))?.label || 'Dashboard';
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

  const header = (
    <Header actions={headerActions} showMenuButton={userRole !== 'supervisor'}>
      <div className="flex w-full items-center gap-3">
        <div className="hidden items-center gap-2 md:flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-3-2-3-5a7 7 0 0 0-14 0c0 3 1 4 3 5s3 3 3 5a7 7 0 0 0 7 7Z" />
            <path d="M12 10.5A2.5 2.5 0 0 1 9.5 8" />
          </svg>
          <span className="font-headline text-lg">Génesis Sign</span>
        </div>
        <div className="flex flex-1 items-center">
          <h1 className="truncate text-lg font-semibold md:text-xl">{getPageTitle()}</h1>
        </div>
      </div>
    </Header>
  );

  if (isLoading || !userRole) return null;

  return (
    <AuthGuard roles={['ADMIN', 'SUPERVISOR']}>
      {userRole === 'supervisor' ? (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          {header}
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
        </div>
      ) : (
        <AppLayout
          header={header}
          sidebar={
            <AdminSidebar
              routes={routes}
              pathname={pathname}
              isLoading={isLoading}
              onNavigate={(href) => router.push(href)}
            />
          }
        >
          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</div>
        </AppLayout>
      )}
    </AuthGuard>
  );
}

function AdminSidebar({ routes, pathname, isLoading, onNavigate }: AdminSidebarProps) {
  const { closeSidebar } = useSidebarSheet();

  const handleNavigate = React.useCallback(
    (href: string) => {
      onNavigate(href);
      closeSidebar();
    },
    [onNavigate, closeSidebar]
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-3-2-3-5a7 7 0 0 0-14 0c0 3 1 4 3 5s3 3 3 5a7 7 0 0 0 7 7Z" />
            <path d="M12 10.5A2.5 2.5 0 0 1 9.5 8" />
          </svg>
          <span className="font-headline text-lg">Génesis Sign</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {isLoading && routes.length === 0
            ? Array.from({ length: 5 }).map((_, index) => (
                <SidebarMenuSkeleton key={index} showIcon />
              ))
            : routes.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => handleNavigate(item.href)}
                    isActive={pathname.startsWith(item.href)}
                    icon={item.Icon}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="hidden justify-end md:flex">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => closeSidebar()}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Cerrar navegación</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
