"use client";

import React, { useState, useEffect } from "react";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getDocumentsByUser, type SupervisionDoc } from "@/services/documentsService";
import { getMe } from "@/services/usersService";

function toUiDocument(d: SupervisionDoc): Document {
  const anyDoc: any = {
    id: String(d.id),
    code: d.codigo ?? "",
    name: d.titulo ?? "",
    description: d.descripcion ?? "",
    sendDate: d.addDate ?? "",
    status: d.estado,            
    daysElapsed: d.diasTranscurridos ?? 0,
    company: d.empresa?.nombre ?? "",
    note: d.descripcionEstado ?? "",
  };

  anyDoc.state = anyDoc.status;
  anyDoc.diasTranscurridos = anyDoc.daysElapsed;

  return anyDoc as Document;
}

export default function MisDocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const me = await getMe();
        const raw = await getDocumentsByUser(Number(me.id));
        const items = Array.isArray(raw) ? raw : [];
        setDocuments(items.map(toUiDocument));
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
