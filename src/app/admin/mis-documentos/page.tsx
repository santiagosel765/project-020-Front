"use client";

import React, { useState, useEffect } from "react";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getDocumentsByUser, type SupervisionDoc } from "@/services/documentsService";
import { getMe } from "@/services/usersService";

function toUiDocument(d: SupervisionDoc): Document {
  const add = d.addDate ?? '';
  const onlyDate = add ? String(add).split('T')[0] : '';

  const anyDoc: any = {
    id: String(d.id ?? ''),
    code: d.codigo ?? '',
    name: d.titulo ?? '',
    description: d.descripcion ?? '',
    sendDate: onlyDate,
    status: d.estado,
    daysElapsed: d.diasTranscurridos ?? 0,
    company: d.empresa?.nombre ?? '',
    note: d.descripcionEstado ?? '',
    assignedCount: 1,
    assigned: [], 
  };

  anyDoc.state = anyDoc.status;
  anyDoc.diasTranscurridos = anyDoc.daysElapsed;

  return anyDoc as Document;
}

export default function MisDocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [meta, setMeta] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const me = await getMe();
        const { items, meta } = await getDocumentsByUser(Number(me.id), { page, limit });
        setDocuments(items.map(toUiDocument));
        setMeta(meta);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error al cargar documentos",
          description: "No se pudieron obtener los datos de los documentos.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, [toast, page]);

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
