import * as React from "react";

import { CardList, type CardListItem } from "@/components/responsive/card-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/data";

interface SignersTableProps {
  users: User[];
  onAdd: (user: User) => void;
  className?: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return parts[0] ? parts[0][0].toUpperCase() : "";
};

const toCardItem = (user: User, onAdd: (u: User) => void): CardListItem => {
  const secondaryItems = [user.position, user.department]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    id: user.id ?? user.correoInstitucional ?? user.employeeCode,
    primary: (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={user.urlFoto || user.fotoPerfil || user.avatar || undefined}
            alt={user.name}
            data-ai-hint="person avatar"
          />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{user.name}</span>
      </div>
    ),
    secondary: secondaryItems.length ? (
      <div className="flex flex-col gap-1">
        {secondaryItems.map((value) => (
          <span key={`${user.id}-${value}`} className="truncate">
            {value}
          </span>
        ))}
      </div>
    ) : null,
    meta: user.correoInstitucional ? (
      <span className="break-all text-muted-foreground">{user.correoInstitucional}</span>
    ) : null,
    actions: [
      {
        label: "Agregar",
        onClick: () => onAdd(user),
        ariaLabel: `Agregar a ${user.name}`,
      },
    ],
  };
};

export function SignersTable({ users, onAdd, className }: SignersTableProps) {
  const cardItems = React.useMemo(() => users.map((user) => toCardItem(user, onAdd)), [users, onAdd]);

  return (
    <div className={cn("border rounded-md", className)}>
      <div className="md:hidden max-h-56 overflow-y-auto p-3">
        {cardItems.length ? (
          <CardList items={cardItems} className="space-y-3" />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No se encontraron firmantes.
          </p>
        )}
      </div>

      <div className="hidden md:block">
        <div className="max-h-56 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Nombre</TableHead>
                <TableHead>Puesto</TableHead>
                <TableHead>Gerencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.urlFoto || user.fotoPerfil || user.avatar || undefined}
                        alt={user.name}
                        data-ai-hint="person avatar"
                      />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.position}</TableCell>
                  <TableCell className="text-muted-foreground">{user.department}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onAdd(user)}
                      aria-label={`Agregar a ${user.name}`}
                    >
                      Agregar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                    No se encontraron firmantes.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
