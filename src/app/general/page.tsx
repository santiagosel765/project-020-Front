
"use client";

import React, { useState, useEffect } from 'react';
import { DocumentsTable } from "@/components/documents-table";
import { Document } from "@/lib/data";
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

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const me = await getMe();
                const { asignaciones } = await getDocumentsByUser(Number(me.id), { page: 1, limit: 20 });
                const mapped: Document[] = asignaciones.map((a: AsignacionDTO) => ({
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
                documents={documents}
                title="Mis Documentos"
                description="Documentos asignados a usted para revisar y firmar."
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
            />
        </div>
    );
}
