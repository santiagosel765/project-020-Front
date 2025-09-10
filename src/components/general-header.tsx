"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, Bell, ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { SettingsDialog } from "./settings-dialog";
import { useSession } from "@/lib/session";

export function GeneralHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useSession();

  const isDocumentDetailPage = pathname.startsWith("/documento/");

  const getTitle = () => {
    if (isDocumentDetailPage) return "Detalle de Documento";
    if (pathname.includes("/general")) return "Mis Documentos";
    return "Génesis Sign";
  };

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {isDocumentDetailPage ? (
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : null}
      <div className="flex items-center gap-2">
        {!isDocumentDetailPage && (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-3-2-3-5a7 7 0 0 0-14 0c0 3 1 4 3 5s3 3 3 5a7 7 0 0 0 7 7Z"/><path d="M12 10.5A2.5 2.5 0 0 1 9.5 8"/></svg>
            <span className="font-headline text-xl">Génesis Sign</span>
          </>
        )}
        <h1 className="text-lg font-semibold md:text-xl">{getTitle()}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <SettingsDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="Usuario" data-ai-hint="person avatar" />
                  <AvatarFallback>UG</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p>Usuario General</p>
                <p className="text-xs text-muted-foreground font-normal">usuario@zignosign.com</p>
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

              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  await handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsDialog>
      </div>
    </header>
  );
}
