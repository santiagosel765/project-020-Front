
"use client";

import React, { useState, useEffect } from 'react';
import { DocumentsTable } from "@/components/documents-table";
import { Document } from "@/lib/data";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import api from "@/lib/api";

export default function GeneralPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const { data } = await api.get<Document[]>('/documents');
                // In a real app, this would be filtered for the current user
                const userDocuments = data.filter((doc: Document) => doc.id !== 'DOC001');
                setDocuments(userDocuments);
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
