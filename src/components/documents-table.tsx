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
import { Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { initialsFromUser } from "@/lib/avatar";
import { PaginationBar } from "./pagination/PaginationBar";
import { DateCell } from "@/components/DateCell";
import { ElapsedDaysCell } from "@/components/ElapsedDaysCell";
import { formatGTDateTime } from "@/lib/date";
import type { PageEnvelope } from "@/lib/pagination";
import { FiltersBar, FilterChips, type FilterChip } from "./filters/filters-bar";
import { FiltersDrawer } from "./filters/filters-drawer";
import { CardList } from "@/components/responsive/card-list";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useSession } from "@/lib/session";
import {
  INITIAL_STATUS_COUNTS,
  MY_SIGN_FILTER_OPTIONS,
  MySignFilter,
  STATUS_FILTER_OPTIONS,
  StatusFilter,
  getMySignFilterLabel,
  getMySignInfo,
  getStatusFilterLabel,
  statusFilterToStatusName,
} from "@/lib/document-filters";

interface DocumentsTableProps {
  data?: PageEnvelope<Document>;
  title: string;
  description: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  mySignFilter: MySignFilter;
  onMySignFilterChange: (value: MySignFilter) => void;
  sortOrder: "asc" | "desc";
  onSortToggle: () => void;
  onAsignadosClick?: (doc: Document) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  currentUserId?: number;
  loading?: boolean;
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

const getButtonStatusClass = (status: StatusFilter, currentFilter: StatusFilter): string => {
  if (status === "ALL") {
    return currentFilter === "ALL"
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground hover:text-foreground";
  }

  const colorClasses: Record<Exclude<StatusFilter, "ALL">, string> = {
    COMPLETADO:
      "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 focus:ring-green-500",
    EN_PROGRESO:
      "bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 focus:ring-yellow-500",
    RECHAZADO:
      "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 focus:ring-red-500",
  };

  const activeClass = "ring-2 ring-offset-2 ring-primary";
  const baseClass = colorClasses[status];
  return currentFilter === status ? `${baseClass} ${activeClass}` : baseClass;
};

const AvatarGroup: React.FC<{ users?: DocumentUser[] }> = ({ users = [] }) => (
  <div className="flex -space-x-2 overflow-hidden">
    {users.slice(0, 3).map((user, idx) => (
      <Avatar
        key={`${user.id}-${user.responsibility ?? ""}-${idx}`}
        className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
        title={`${user.name} • ${user.responsibility ?? ""}`}
      >
        <AvatarImage src={user.avatar} data-ai-hint="person avatar" />
        <AvatarFallback>
          {initialsFromUser({ primer_nombre: user.name })}
        </AvatarFallback>
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
  data,
  title,
  description,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  mySignFilter,
  onMySignFilterChange,
  sortOrder,
  onSortToggle,
  onAsignadosClick,
  onPageChange,
  onLimitChange,
  currentUserId,
  loading = false,
}: DocumentsTableProps) {
  const router = useRouter();
  const isMdUp = useBreakpoint("md");
  const { isAdmin } = useSession();
  const canEdit = Boolean(isAdmin);

  const rawDocuments = data?.items ?? [];
  const hasUserId = typeof currentUserId === "number" && Number.isFinite(currentUserId);

  const filteredBySign = React.useMemo(() => {
    if (!rawDocuments.length) return [] as Document[];
    if (mySignFilter === "ALL") return rawDocuments;
    if (!hasUserId) return [] as Document[];

    return rawDocuments.filter((doc) => {
      const info = getMySignInfo(doc, currentUserId);
      if (mySignFilter === "SIGNED") return info.assigned && info.signed;
      if (mySignFilter === "UNSIGNED") return info.assigned && info.unsigned;
      return true;
    });
  }, [rawDocuments, mySignFilter, currentUserId, hasUserId]);

  const counts = React.useMemo(() => {
    const base = { ...INITIAL_STATUS_COUNTS };
    base.ALL = filteredBySign.length;
    for (const doc of filteredBySign) {
      const statusName = doc.status ?? ((doc as any)?.cuadro_firma?.estado_firma?.nombre ?? "");
      if (statusName === "En Progreso") base.EN_PROGRESO += 1;
      else if (statusName === "Completado") base.COMPLETADO += 1;
      else if (statusName === "Rechazado") base.RECHAZADO += 1;
    }
    return base;
  }, [filteredBySign]);

  const documents = React.useMemo(() => {
    if (statusFilter === "ALL") return filteredBySign;
    const statusName = statusFilterToStatusName(statusFilter);
    if (!statusName) return filteredBySign;
    return filteredBySign.filter((doc) => {
      const name = doc.status ?? ((doc as any)?.cuadro_firma?.estado_firma?.nombre ?? "");
      return name === statusName;
    });
  }, [filteredBySign, statusFilter]);

  const handleRowClick = (docId: string) => {
    router.push(`/documento/${docId}`);
  };

  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasPrev = Boolean(data?.hasPrev);
  const hasNext = Boolean(data?.hasNext);
  const currentLimit = data?.limit ?? 10;
  const emptyMessage = "Sin resultados para los filtros seleccionados.";

  const toCardItem = (doc: Document) => {
    const users = doc.assignedUsers ?? [];
    const sendDateTooltip = formatGTDateTime(doc.sendDate);
    const sendDateTitle = sendDateTooltip !== "—" ? `${sendDateTooltip} GT` : undefined;

    return {
      id: doc.id,
      primary: (
        <button
          type="button"
          onClick={() => handleRowClick(doc.id)}
          className="max-w-full text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {doc.name || "Sin título"}
        </button>
      ),
      secondary: doc.description ? (
        <span className="line-clamp-2 text-muted-foreground">{doc.description}</span>
      ) : undefined,
      meta: (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border", getStatusClass(doc.status))}>{doc.status}</Badge>
            <span className="text-xs font-medium uppercase tracking-wide text-foreground/80">
              Días: <ElapsedDaysCell fromISO={doc.sendDate} title={sendDateTitle} />
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Fecha envío
            </span>
            <span className="text-sm text-foreground">
              <DateCell value={doc.sendDate} withTime />
            </span>
          </div>
          {users.length ? (
            <button
              type="button"
              className="flex items-center gap-2 text-left"
              onClick={(event) => {
                event.stopPropagation();
                onAsignadosClick?.(doc);
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Asignados
              </span>
              <AvatarGroup users={users} />
            </button>
          ) : null}
        </div>
      ),
      actions: (
        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            size="sm"
            onClick={(event) => {
              event.preventDefault();
              handleRowClick(doc.id);
            }}
          >
            Ver detalle
          </Button>
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.preventDefault();
                router.push(`/admin/asignaciones/${doc.id}`);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      ),
    };
  };

  const renderFilters = (variant: "bar" | "drawer") => {
    const isDrawer = variant === "drawer";

    return (
      <>
        <div
          className={cn(
            "relative w-full md:w-80",
            isDrawer && "w-full",
          )}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            className={cn("pl-8", isDrawer && "w-full")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div
          className={cn(
            "flex flex-col gap-2 md:flex-row md:items-center md:justify-between",
            isDrawer && "md:flex-col",
          )}
        >
          <div
            role="tablist"
            aria-label="Filtrar por estado"
            className={cn(
              "flex gap-2 overflow-x-auto no-scrollbar py-1",
              isDrawer && "flex-wrap overflow-x-visible",
            )}
          >
            {STATUS_FILTER_OPTIONS.map((option) => {
              const count = counts[option.value];
              return (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() => onStatusFilterChange(option.value)}
                  className={cn(
                    getButtonStatusClass(option.value, statusFilter),
                    "h-8 px-2.5 py-1.5 whitespace-nowrap",
                    isDrawer && "justify-between",
                  )}
                  variant="outline"
                  aria-pressed={statusFilter === option.value}
                >
                  <span>{option.label}</span>
                  <span className="ml-2 text-xs opacity-75">({count ?? 0})</span>
                </Button>
              );
            })}
          </div>
          <div
            className={cn(
              "flex items-center gap-2 shrink-0",
              isDrawer && "w-full justify-between md:justify-start",
            )}
            role="group"
            aria-label="Filtrar por mi firma"
          >
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Mi firma
            </span>
            <div className="inline-flex items-center gap-1 rounded-md border bg-background p-0.5 shadow-sm">
              {MY_SIGN_FILTER_OPTIONS.map((option) => {
                const isActive = mySignFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onMySignFilterChange(option.value)}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm.trim()) {
    filterChips.push({
      id: "search",
      label: `Búsqueda: "${searchTerm}"`,
      onRemove: () => onSearchChange(""),
    });
  }
  if (statusFilter !== "ALL") {
    filterChips.push({
      id: "status",
      label: `Estado: ${getStatusFilterLabel(statusFilter)}`,
      onRemove: () => onStatusFilterChange("ALL"),
    });
  }
  if (mySignFilter !== "ALL") {
    filterChips.push({
      id: "my-sign",
      label: `Mi firma: ${getMySignFilterLabel(mySignFilter)}`,
      onRemove: () => onMySignFilterChange("ALL"),
    });
  }

  return (
    <Card className="w-full h-full flex flex-col glassmorphism">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <FiltersDrawer
              renderFilters={renderFilters}
              chips={filterChips}
              title="Filtros de documentos"
            />
          </div>
          <FiltersBar renderFilters={renderFilters} chips={filterChips} />
          <FilterChips chips={filterChips} className="md:hidden" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        {isMdUp ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Doc.</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead
                  className="hidden sm:table-cell cursor-pointer select-none"
                  onClick={() => {
                    onSortToggle();
                  }}
                >
                  <div className="flex items-center gap-2">
                    Fecha Envío {sortOrder === "desc" ? "↓" : "↑"}
                  </div>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Días Transcurridos</TableHead>
                <TableHead>Asignados</TableHead>
                {canEdit && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const users = doc.assignedUsers ?? [];
                const sendDateTooltip = formatGTDateTime(doc.sendDate);
                const sendDateTitle =
                  sendDateTooltip !== "—" ? `${sendDateTooltip} GT` : undefined;
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
                      <DateCell value={doc.sendDate} withTime />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border", getStatusClass(doc.status))}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <ElapsedDaysCell
                        fromISO={doc.sendDate}
                        title={sendDateTitle}
                      />
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
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/asignaciones/${doc.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 7 : 6}
                    className="text-center py-4 text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col gap-4">
            {documents.length > 0 ? (
              <CardList
                items={documents.map(toCardItem)}
                primary={(item) => item.primary}
                secondary={(item) => item.secondary}
                meta={(item) => item.meta}
                actions={(item) => item.actions}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
              />
            ) : (
              !loading && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              )
            )}
          </div>
        )}
      </CardContent>
      <PaginationBar
        total={total}
        page={currentPage}
        pages={totalPages}
        limit={currentLimit}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Card>
  );
}
