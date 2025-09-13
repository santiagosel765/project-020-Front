"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import type { SupervisionDoc, DocEstado } from '@/services/documentsService';

interface SupervisionTableProps {
  documents: SupervisionDoc[];
  title: string;
  description: string;
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

export function SupervisionTable({ documents: docs, title, description }: SupervisionTableProps) {
  const documents = Array.isArray(docs) ? docs : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocEstado | 'Todos'>('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const counts = useMemo(
    () =>
      documents.reduce(
        (acc, d) => {
          acc.Todos++;
          acc[d.estado] = (acc[d.estado] ?? 0) + 1;
          return acc;
        },
        { Todos: 0, Pendiente: 0, 'En Progreso': 0, Rechazado: 0, Completado: 0 } as Record<string, number>,
      ),
    [documents],
  );

  const parseDate = (d?: string) => (d ? new Date(d).getTime() : 0);

  const filtered = useMemo(() => {
    let list = documents.filter(
      (d) =>
        (d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.descripcion ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.empresa?.nombre ?? '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'Todos' || d.estado === statusFilter),
    );
    list.sort((a, b) => {
      const aDate = parseDate(a.addDate);
      const bDate = parseDate(b.addDate);
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [documents, searchTerm, statusFilter, sortOrder]);

  const handleSort = () => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));

  const statusButtons: (DocEstado | 'Todos')[] = ['Todos', 'Completado', 'En Progreso', 'Rechazado', 'Pendiente'];

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
              placeholder="Buscar por título, empresa..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {statusButtons.map((status) => (
            <Button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(getButtonStatusClass(status, statusFilter), 'h-8 px-2.5 py-1.5')}
              variant="outline"
            >
              {status} <span className="ml-2 text-xs opacity-75">({counts[status]})</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={handleSort}>
                <div className="flex items-center gap-2">
                  Título
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{d.empresa?.nombre ?? ''}</TableCell>
                <TableCell>
                  <Badge className={cn('border', getStatusClass(d.estado))}>{d.estado}</Badge>
                </TableCell>
                <TableCell>{d.diasTranscurridos ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">{d.descripcionEstado ?? ''}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                  No hay documentos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

