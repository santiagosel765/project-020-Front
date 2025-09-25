"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import type { SupervisionDoc, DocEstado } from '@/services/documentsService';
import { PaginationBar } from './pagination/PaginationBar';
import type { PageEnvelope } from '@/lib/pagination';
import { ElapsedDaysCell } from '@/components/ElapsedDaysCell';
import { DateCell } from '@/components/DateCell';
import { formatGTDateTime } from '@/lib/date';
import { CardList } from '@/components/responsive/card-list';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { FiltersBar, FilterChips, type FilterChip } from './filters/filters-bar';
import { FiltersDrawer } from './filters/filters-drawer';

interface SupervisionTableProps {
  data?: PageEnvelope<SupervisionDoc>;
  title: string;
  description: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: DocEstado | 'Todos';
  onStatusFilterChange: (value: DocEstado | 'Todos') => void;
  sortOrder: 'asc' | 'desc';
  onSortToggle: () => void;
  statusCounts?: Record<DocEstado | 'Todos', number>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
}

const getStatusClass = (status: DocEstado): string => {
  switch (status) {
    case 'Completado':
      return 'bg-green-100 text-green-800 border-green-400';
    case 'En Progreso':
      return 'bg-yellow-100 text-yellow-800 border-yellow-400';
    case 'Rechazado':
      return 'bg-red-100 text-red-800 border-red-400';
    case 'Pendiente':
      return 'bg-blue-100 text-blue-800 border-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-400';
  }
};

const getButtonStatusClass = (status: DocEstado | 'Todos', current: DocEstado | 'Todos'): string => {
  if (status === 'Todos') {
    return current === 'Todos' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  }
  const colorClasses = {
    Completado:
      'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 focus:ring-green-500',
    'En Progreso':
      'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 focus:ring-yellow-500',
    Rechazado: 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 focus:ring-red-500',
    Pendiente: 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 focus:ring-blue-500',
  } as const;
  const activeClass = 'ring-2 ring-offset-2 ring-primary';
  const baseClass = colorClasses[status];
  return current === status ? `${baseClass} ${activeClass}` : baseClass;
};

export function SupervisionTable({
  data,
  title,
  description,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortToggle,
  statusCounts,
  onPageChange,
  onLimitChange,
  loading = false,
}: SupervisionTableProps) {
  const documents = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasPrev = Boolean(data?.hasPrev);
  const hasNext = Boolean(data?.hasNext);
  const currentLimit = data?.limit ?? 10;
  const isMdUp = useBreakpoint('md');
  const fallbackCounts = useMemo(
    () =>
      documents.reduce(
        (acc, d) => {
          acc.Todos++;
          acc[d.estado] = (acc[d.estado] ?? 0) + 1;
          return acc;
        },
        { Todos: 0, Pendiente: 0, 'En Progreso': 0, Rechazado: 0, Completado: 0 } as Record<DocEstado | 'Todos', number>,
      ),
    [documents],
  );
  const counts = statusCounts ?? fallbackCounts;

  const statusButtons: (DocEstado | 'Todos')[] = ['Todos', 'Completado', 'En Progreso', 'Rechazado', 'Pendiente'];

  const renderFilters = (variant: 'bar' | 'drawer') => {
    const isDrawer = variant === 'drawer';

    return (
      <>
        <div
          className={cn(
            'relative flex-1 min-w-[200px] md:max-w-xs',
            isDrawer && 'w-full',
          )}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, empresa..."
            className={cn('pl-8', isDrawer && 'w-full')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div
          className={cn(
            'flex flex-wrap gap-2',
            isDrawer ? 'w-full flex-col' : 'items-center',
          )}
        >
          {statusButtons.map((status) => (
            <Button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={cn(
                getButtonStatusClass(status, statusFilter),
                'h-8 px-2.5 py-1.5',
                isDrawer && 'w-full justify-between',
              )}
              variant="outline"
            >
              <span>{status}</span>
              <span className={cn('text-xs opacity-75', isDrawer ? 'ml-0' : 'ml-2')}>
                ({counts[status] ?? 0})
              </span>
            </Button>
          ))}
        </div>
      </>
    );
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm.trim()) {
    filterChips.push({
      id: 'search',
      label: `Búsqueda: "${searchTerm}"`,
      onRemove: () => onSearchChange(''),
    });
  }
  if (statusFilter !== 'Todos') {
    filterChips.push({
      id: 'status',
      label: `Estado: ${statusFilter}`,
      onRemove: () => onStatusFilterChange('Todos'),
    });
  }

  const toCardItem = (d: SupervisionDoc) => {
    const addDateTooltip = formatGTDateTime(d.addDate);
    const addDateTitle = addDateTooltip !== '—' ? `${addDateTooltip} GT` : undefined;
    const hasSecondary = Boolean(d.empresa?.nombre || d.descripcion || d.codigo);

    return {
      id: d.id,
      primary: <span>{d.titulo}</span>,
      secondary: hasSecondary ? (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {d.empresa?.nombre ? <span className="truncate">{d.empresa?.nombre}</span> : null}
          {d.descripcion ? <span className="line-clamp-2">{d.descripcion}</span> : null}
          {d.codigo ? (
            <span className="text-xs uppercase tracking-wide text-foreground/70">Código: {d.codigo}</span>
          ) : null}
        </div>
      ) : undefined,
      meta: (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('border', getStatusClass(d.estado))}>{d.estado}</Badge>
            <span className="text-xs font-medium uppercase tracking-wide text-foreground/80">
              Días: <ElapsedDaysCell fromISO={d.addDate ?? undefined} title={addDateTitle} />
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Fecha envío</span>
            <span className="text-sm text-foreground">
              <DateCell value={d.addDate} withTime />
            </span>
          </div>
          {d.descripcionEstado ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Nota</span>
              <span className="text-sm text-muted-foreground">{d.descripcionEstado}</span>
            </div>
          ) : null}
        </div>
      ),
    };
  };

  return (
    <Card className="w-full h-full flex flex-col glassmorphism">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <FiltersDrawer
              renderFilters={renderFilters}
              chips={filterChips}
              title="Filtros de supervisión"
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
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => {
                    onSortToggle();
                  }}
                >
                  <div className="flex items-center gap-2">
                    Título {sortOrder === 'desc' ? '↓' : '↑'}
                  </div>
                </TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => {
                const addDateTooltip = formatGTDateTime(d.addDate);
                const addDateTitle = addDateTooltip !== '—' ? `${addDateTooltip} GT` : undefined;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">{d.empresa?.nombre ?? ''}</TableCell>
                    <TableCell>
                      <Badge className={cn('border', getStatusClass(d.estado))}>{d.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <ElapsedDaysCell
                        fromISO={d.addDate ?? undefined}
                        title={addDateTitle}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.descripcionEstado ?? ''}</TableCell>
                  </TableRow>
                );
              })}
              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                    No hay documentos.
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
                gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
              />
            ) : (
              !loading && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay documentos.
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
