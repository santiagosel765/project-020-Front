
"use client";

import React, { useState, useEffect } from 'react';
import { DocumentsTable } from "@/components/documents-table";
import { Document } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getDocumentsByUser, type SupervisionDoc } from "@/services/documentsService";
import { getMe } from "@/services/usersService";

export default function GeneralPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const me = await getMe();
                const { items } = await getDocumentsByUser(Number(me.id), { page: 1, limit: 20 });
                const mapped: Document[] = items.map((d: SupervisionDoc) => ({
                    id: String(d.id),
                    code: d.codigo ?? '',
                    name: d.titulo ?? '',
                    description: d.descripcion ?? '',
                    sendDate: d.addDate ?? '',
                    lastStatusChangeDate: d.addDate ?? '',
                    businessDays: d.diasTranscurridos ?? 0,
                    status: d.estado,
                    assignedUsers: [],
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
            />
        </div>
    );
}
