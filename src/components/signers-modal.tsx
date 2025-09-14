"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initialsFromUser, fullName, subtitleFromUser } from "@/lib/avatar";
import type { SignerSummary } from "@/services/documentsService";

interface SignersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmantes: SignerSummary[];
  loading: boolean;
}

export function SignersModal({ open, onOpenChange, firmantes, loading }: SignersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glassmorphism" aria-describedby="signers-desc">
        <DialogHeader>
          <DialogTitle>Firmantes Asignados ({firmantes.length})</DialogTitle>
          <DialogDescription id="signers-desc">
            Personas asignadas a este documento
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <li className="text-sm text-muted-foreground">Cargando firmantes...</li>
          ) : (
            firmantes.map((f) => (
              <li
                key={`${f.user.id}-${f.responsabilidad_firma.id}`}
                className="flex items-center gap-4"
              >
                <Avatar>
                  <AvatarFallback>{initialsFromUser(f.user)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {fullName(f.user) || f.user.correo_institucional}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {subtitleFromUser(f.user)}
                  </span>
                </div>
                <div className="ml-auto flex gap-2">
                  <Badge variant="outline">
                    {f.responsabilidad_firma?.nombre ?? "—"}
                  </Badge>
                  <Badge variant={f.estaFirmado ? "default" : "secondary"}>
                    {f.estaFirmado ? "Firmado" : "Pendiente"}
                  </Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default SignersModal;
