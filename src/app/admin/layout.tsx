

"use client";

import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { FilePlus2, FolderKanban, ShieldCheck, Users, LogOut, Settings, Bell, Menu, FileText, PanelLeft } from 'lucide-react';
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
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role);
      
      if (role === 'supervisor' && pathname !== '/admin/supervision') {
        router.replace('/admin/supervision');
      }
    }
  }, [pathname, router]);

  const allMenuItems = [
    { href: '/admin/asignaciones', label: 'Asignaciones', icon: FilePlus2, roles: ['admin'] },
    { href: '/admin/documentos', label: 'Documentos', icon: FolderKanban, roles: ['admin'] },
    { href: '/admin/mis-documentos', label: 'Mis Documentos', icon: FileText, roles: ['admin'] },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
    { href: '/admin/supervision', label: 'Supervisión', icon: ShieldCheck, roles: ['admin', 'supervisor'] },
  ];

  const menuItems = allMenuItems.filter(item => userRole && item.roles.includes(userRole));

  const getPageTitle = () => {
    if (userRole === 'supervisor') return 'Supervisión';
    return allMenuItems.find(item => pathname.startsWith(item.href))?.label || 'Dashboard';
  }

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
    }
    router.push('/');
  }

  const header = (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:h-16 md:px-6">
            <div className="flex-1 md:hidden">
              {userRole !== 'supervisor' && (
                <SidebarTrigger>
                  <Menu/>
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
                          <AvatarImage src="https://placehold.co/100x100.png" alt="Admin" data-ai-hint="person avatar"/>
                          <AvatarFallback>{userRole === 'admin' ? 'AD' : 'SP'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <p>{userRole === 'admin' ? 'Admin' : 'Supervisor'}</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          {userRole === 'admin' ? 'admin@zignosign.com' : 'supervisor@zignosign.com'}
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

  if (userRole === 'supervisor') {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        {header}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    )
  }

  return (
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
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
  );
}
