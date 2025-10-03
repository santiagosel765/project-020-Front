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
import { ChevronDown, Pencil, Search } from "lucide-react";
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
  getStatusFilterLabel,
  statusFilterToStatusName,
} from "@/lib/document-filters";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { getMySignInfo } from "@/utils/signature";

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
      const { assigned, signed } = getMySignInfo(doc, Number(currentUserId));
      if (mySignFilter === "SIGNED") return assigned && signed;
      if (mySignFilter === "UNSIGNED") return assigned && !signed;
      return true;
    });
  }, [rawDocuments, mySignFilter, currentUserId, hasUserId]);

  const statusCounts = React.useMemo(() => {
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
  const emptyMessage = "No hay documentos que coincidan con los filtros.";

  const renderSignatureChip = React.useCallback(
    (doc: Document): React.ReactNode => {
      if (!hasUserId) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      const { assigned, signed, lastSignedAt } = getMySignInfo(doc, Number(currentUserId));
      if (!assigned) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      const title = signed && lastSignedAt ? new Date(lastSignedAt).toLocaleString() : undefined;

      return (
        <span
          aria-label="Estado de mi firma"
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            signed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
          )}
          title={title}
        >
          {signed ? "Firmado" : "No firmado"}
        </span>
      );
    },
    [currentUserId, hasUserId],
  );

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
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Mi firma
            </span>
            <div className="text-sm text-foreground">{renderSignatureChip(doc)}</div>
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

  const [statusPopoverOpen, setStatusPopoverOpen] = React.useState(false);

  const renderFilters = (variant: "bar" | "drawer") => {
    const isDrawer = variant === "drawer";

    const statusDisplayLabel = getStatusFilterLabel(statusFilter) || "Todos";
    const statusButtonText =
      statusFilter === "ALL"
        ? `Estado: ${statusDisplayLabel} (${statusCounts.ALL})`
        : `Estado: ${statusDisplayLabel}`;

    const handleStatusChange = (value: StatusFilter) => {
      onStatusFilterChange(value);
      if (!isDrawer) {
        setStatusPopoverOpen(false);
      }
    };

    const renderStatusOptions = (idPrefix: string) => (
      <RadioGroup
        value={statusFilter}
        onValueChange={(value) => handleStatusChange(value as StatusFilter)}
        className="flex flex-col gap-1"
        aria-label="Filtrar por estado"
      >
        {STATUS_FILTER_OPTIONS.map((option) => {
          const count = statusCounts[option.value];
          const controlId = `${idPrefix}-${option.value.toLowerCase()}`;
          const isActive = statusFilter === option.value;
          return (
            <Label
              key={option.value}
              htmlFor={controlId}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id={controlId} value={option.value} />
                <span>{option.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{count}</span>
            </Label>
          );
        })}
      </RadioGroup>
    );

    const statusControl = isDrawer ? (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">Estado</span>
        <select
          id="status-filter-mobile"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter}
          onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
        >
          {STATUS_FILTER_OPTIONS.map((option) => {
            const count = statusCounts[option.value];
            return (
              <option key={option.value} value={option.value}>
                {`${option.label} (${count})`}
              </option>
            );
          })}
        </select>
      </div>
    ) : (
      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-2">
        <div className="w-full md:hidden">
          <label htmlFor="status-filter-select" className="sr-only">
            Estado
          </label>
          <select
            id="status-filter-select"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(event) => handleStatusChange(event.target.value as StatusFilter)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => {
              const count = statusCounts[option.value];
              return (
                <option key={option.value} value={option.value}>
                  {`${option.label} (${count})`}
                </option>
              );
            })}
          </select>
        </div>
        <div className="hidden md:block">
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center justify-between gap-2 whitespace-nowrap"
              >
                <span>{statusButtonText}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-2 p-3" align="start">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estado
              </p>
              {renderStatusOptions("popover-status")}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );

    const mySignControl = (
      <div
        className={cn(
          "flex flex-col gap-2",
          isDrawer ? "w-full" : "md:flex-row md:items-center md:gap-2",
        )}
        role="group"
        aria-label="Filtrar por mi firma"
      >
        <div
          className={cn(
            "grid w-full grid-cols-3 gap-1",
            "md:inline-flex md:w-auto md:items-center md:gap-0 md:rounded-md md:border md:bg-background md:p-0.5 md:shadow-sm",
          )}
        >
          {MY_SIGN_FILTER_OPTIONS.map((option) => {
            const isActive = mySignFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onMySignFilterChange(option.value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  "md:flex-none",
                )}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );

    return (
      <div
        className={cn(
          "flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between",
          isDrawer && "md:flex-col",
        )}
      >
        <div
          className={cn(
            "relative w-full md:max-w-sm",
            isDrawer && "md:max-w-none",
          )}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div
          className={cn(
            "flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3",
            isDrawer && "md:w-full",
          )}
        >
          <div className={cn("w-full md:w-auto", isDrawer && "w-full")}>{statusControl}</div>
          <div className={cn("w-full md:w-auto", isDrawer && "w-full")}>{mySignControl}</div>
        </div>
      </div>
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
                <TableHead>Mi firma</TableHead>
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
                    <TableCell>{renderSignatureChip(doc)}</TableCell>
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
