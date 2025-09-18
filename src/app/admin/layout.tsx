"use client";

import React, { useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useSession } from '@/lib/session';
import { initials } from '@/lib/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LogOut,
  Settings,
  Bell,
  Menu,
  FileText,
  PanelLeft,
  FilePlus2,
  FolderKanban,
  Users,
  Key,
  FileIcon,
  ShieldIcon,
  ShieldCheck,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SettingsDialog } from '@/components/settings-dialog';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

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
  const routes = adminPages
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

  const header = (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:h-16 md:px-6">
      <div className="flex-1 md:hidden">
        {userRole !== 'supervisor' && (
          <SidebarTrigger>
            <Menu />
          </SidebarTrigger>
        )}
      </div>
      <div className="hidden md:flex flex-1 items-center">
        <h1 className="text-lg font-semibold md:text-xl">
          {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
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
    </header>
  );

  if (isLoading || !userRole) return null;

  return (
    <AuthGuard roles={['ADMIN', 'SUPERVISOR']}>
      {userRole === 'supervisor' ? (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          {header}
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {children}
          </main>
        </div>
      ) : (
        <SidebarProvider defaultOpen={!isMobile}>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-3-2-3-5a7 7 0 0 0-14 0c0 3 1 4 3 5s3 3 3 5a7 7 0 0 0 7 7Z"/><path d="M12 10.5A2.5 2.5 0 0 1 9.5 8"/></svg>
                <span className="font-headline text-lg group-data-[collapsible=icon]:hidden">
                  Génesis Sign
                </span>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {isLoading && routes.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuSkeleton key={i} showIcon />
                  ))
                ) : (
                  routes.map((item: any) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => router.push(item.href)}
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                      >
                        <item.Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <div className="hidden md:flex justify-end p-2">
                <SidebarTrigger>
                    <PanelLeft className="h-5 w-5" />
                </SidebarTrigger>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            {header}
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </AuthGuard>
  );
}
