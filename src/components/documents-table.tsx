"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Document, DocumentUser } from "@/lib/data";
import { Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { initials } from "@/lib/avatar";

interface DocumentsTableProps {
  documents: Document[];
  title: string;
  description: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: Document["status"] | "Todos";
  onStatusFilterChange: (value: Document["status"] | "Todos") => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (value: "asc" | "desc") => void;
  onAsignadosClick?: (doc: Document) => void;
}

const getStatusClass = (status: Document["status"]): string => {
  switch (status) {
    case "Completado":
      return "bg-green-100 text-green-800 border-green-400";
    case "En Progreso":
      return "bg-yellow-100 text-yellow-800 border-yellow-400";
    case "Rechazado":
      return "bg-red-100 text-red-800 border-red-400";
    case "Pendiente":
      return "bg-blue-100 text-blue-800 border-blue-400";
    default:
      return "bg-gray-100 text-gray-800 border-gray-400";
  }
};

const getButtonStatusClass = (
  status: Document["status"] | "Todos",
  currentFilter: Document["status"] | "Todos",
): string => {
  if (status === "Todos") {
    return currentFilter === "Todos"
      ? "bg-primary text-primary-foreground"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300";
  }
  const colorClasses = {
    Completado:
      "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 focus:ring-green-500",
    "En Progreso":
      "bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 focus:ring-yellow-500",
    Rechazado:
      "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 focus:ring-red-500",
    Pendiente:
      "bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 focus:ring-blue-500",
  } as const;
  const activeClass = "ring-2 ring-offset-2 ring-primary";
  const baseClass = colorClasses[status as keyof typeof colorClasses];
  return currentFilter === status ? `${baseClass} ${activeClass}` : baseClass;
};

const AvatarGroup: React.FC<{ users?: DocumentUser[] }> = ({ users = [] }) => (
  <div className="flex -space-x-2 overflow-hidden">
    {users.slice(0, 3).map((user) => (
      <Avatar
        key={user.id}
        className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
        title={`${user.name} • ${user.responsibility ?? ''}`}
      >
        <AvatarImage src={user.avatar} data-ai-hint="person avatar" />
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>
    ))}
    {users.length > 3 && (
      <Avatar className="relative flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background">
        <AvatarFallback>+{users.length - 3}</AvatarFallback>
      </Avatar>
    )}
  </div>
);

export function DocumentsTable({
  documents,
  title,
  description,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  onAsignadosClick,
}: DocumentsTableProps) {
  const router = useRouter();

  const handleSort = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  };

  const statusButtons: (Document["status"] | "Todos")[] = [
    "Todos",
    "Completado",
    "En Progreso",
    "Rechazado",
    "Pendiente",
  ];

  const handleRowClick = (docId: string) => {
    router.push(`/documento/${docId}`);
  };

  return (
    <Card className="w-full h-full flex flex-col glassmorphism">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {statusButtons.map((status) => (
            <Button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={cn(
                getButtonStatusClass(status, statusFilter),
                "h-8 px-2.5 py-1.5",
              )}
              variant="outline"
            >
              {status}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Doc.</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead
                className="hidden sm:table-cell cursor-pointer"
                onClick={handleSort}
              >
                <div className="flex items-center gap-2">
                  Fecha Envío
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Días Transcurridos</TableHead>
              <TableHead>Asignados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(documents ?? []).map((doc) => {
              const users = doc.assignedUsers ?? [];
              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => handleRowClick(doc.id)}
                      className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                    >
                      {doc.name}
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {doc.description}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {doc.sendDate}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border", getStatusClass(doc.status))}>
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.businessDays}
                  </TableCell>
                  <TableCell>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAsignadosClick?.(doc);
                      }}
                    >
                      <AvatarGroup users={users} />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

