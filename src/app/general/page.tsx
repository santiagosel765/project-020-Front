
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DocumentsTable } from "@/components/documents-table";
import { Document } from "@/lib/data";
import { getTime } from "@/lib/date";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getDocumentsByUser, type AsignacionDTO } from "@/services/documentsService";
import { getMe } from "@/services/usersService";

export default function GeneralPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const me = await getMe();
                const { items } = await getDocumentsByUser(Number(me.id), { page: 1, limit: 20 });
                const mapped: Document[] = items.map((a: AsignacionDTO) => ({
                    id: String(a.cuadro_firma.id),
                    code: a.cuadro_firma.codigo ?? '',
                    name: a.cuadro_firma.titulo ?? '',
                    description: a.cuadro_firma.descripcion ?? '',
                    sendDate: a.cuadro_firma.add_date ?? '',
                    lastStatusChangeDate: a.cuadro_firma.add_date ?? '',
                    businessDays: a.cuadro_firma.diasTranscurridos ?? 0,
                    status: (a.cuadro_firma.estado_firma?.nombre ?? '') as Document['status'],
                    assignedUsers: [] as any,
                }));
                setDocuments(mapped);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error al cargar documentos',
                    description: 'No se pudieron obtener los datos de los documentos.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, [toast]);

    const filteredDocuments = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return documents
            .filter((doc) => {
                const matchesSearch =
                    term === '' ||
                    doc.name.toLowerCase().includes(term) ||
                    doc.description.toLowerCase().includes(term);
                const matchesStatus = statusFilter === 'Todos' || doc.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const aDate = getTime(a.sendDate);
                const bDate = getTime(b.sendDate);
                return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
            });
    }, [documents, searchTerm, statusFilter, sortOrder]);

    const total = filteredDocuments.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const paginatedDocuments = filteredDocuments.slice(start, start + pageSize);

    const statusCounts = useMemo(() => {
        return filteredDocuments.reduce(
            (acc, doc) => {
                acc.Todos += 1;
                acc[doc.status] = (acc[doc.status] ?? 0) + 1;
                return acc;
            },
            { Todos: 0, Pendiente: 0, 'En Progreso': 0, Rechazado: 0, Completado: 0 } as Record<Document['status'] | 'Todos', number>,
        );
    }, [filteredDocuments]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/3" />
                </div>
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    return (
        <div className="h-full">
            <DocumentsTable
                documents={paginatedDocuments}
                title="Mis Documentos"
                description="Documentos asignados a usted para revisar y firmar."
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                statusCounts={statusCounts}
                total={total}
                page={currentPage}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </div>
    );
}
