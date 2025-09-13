"use client";

import React, { useState, useEffect } from 'react';
import { SupervisionTable } from "@/components/supervision-table";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getDocumentSupervision, type SupervisionDoc } from '@/services/documentsService';

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<SupervisionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { items } = await getDocumentSupervision();
        setDocuments(Array.isArray(items) ? items : []);
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
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="h-full">
        <SupervisionTable
            documents={documents}
            title="Gestión de Documentos"
            description="Visualice, busque y gestione todos los documentos de la plataforma."
        />
    </div>
  );
}
