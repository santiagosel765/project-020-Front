"use client";

import React, { useState, useEffect } from "react";
import { DocumentsTable } from "@/components/documents-table";
import type { Document } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocumentsByUser,
  getFirmantesByCuadroId,
  type AsignacionDTO,
} from "@/services/documentsService";
import { getMe } from "@/services/usersService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/avatar";
import { Button } from "@/components/ui/button";

function toUiDocument(a: AsignacionDTO): Document {
  const cf = a.cuadro_firma;
  const add = cf.add_date ?? "";
  const onlyDate = add ? String(add).split("T")[0] : "";
  const assignedUsers = (cf.firmantesResumen ?? []).map((f) => ({
    id: String(f.id),
    name: f.nombre,
    avatar: f.urlFoto ?? undefined,
    responsibility: f.responsabilidad,
    department: "",
    employeeCode: "",
  }));
  const anyDoc: any = {
    id: String(cf.id ?? ""),
    code: cf.codigo ?? "",
    name: cf.titulo ?? "",
    description: cf.descripcion ?? "",
    sendDate: onlyDate,
    status: (cf.estado_firma?.nombre ?? "") as Document["status"],
    businessDays: cf.diasTranscurridos ?? 0,
    assignedUsers,
  };
  return anyDoc as Document;
}

export default function MisDocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [meta, setMeta] = useState<any>({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Document["status"] | "Todos">("Todos");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [firmantes, setFirmantes] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const me = await getMe();
        const params: any = { page, limit, sort: sortOrder };
        if (search) params.search = search;
        if (statusFilter !== "Todos") params.estado = statusFilter;
        const { asignaciones, meta } = await getDocumentsByUser(Number(me.id), params);
        setDocuments(asignaciones.map(toUiDocument));
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
  }, [toast, page, search, statusFilter, sortOrder]);

  const handleAsignadosClick = async (doc: Document) => {
    setModalOpen(true);
    setModalLoading(true);
    try {
      const data = await getFirmantesByCuadroId(Number(doc.id));
      setFirmantes(data);
    } catch {
      setFirmantes([]);
    } finally {
      setModalLoading(false);
    }
  };

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
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(o) => {
          setSortOrder(o);
          setPage(1);
        }}
        onAsignadosClick={handleAsignadosClick}
      />
      <div className="flex justify-end items-center gap-2 mt-4">
        <Button
          variant="outline"
          disabled={!meta?.hasPrevPage}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <span>
          {meta?.page} / {meta?.lastPage || 1}
        </span>
        <Button
          variant="outline"
          disabled={!meta?.hasNextPage}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </Button>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px] glassmorphism">
          <DialogHeader>
            <DialogTitle>Firmantes Asignados ({firmantes.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {modalLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              firmantes.map((f: any) => (
                <div key={f.id} className="flex items-center gap-4">
                  <Avatar title={`${f.nombre} • ${f.responsabilidad}`}>
                    <AvatarImage src={f.url_foto ?? f.urlFoto ?? undefined} />
                    <AvatarFallback>{initials(f.nombre)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{f.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {f.responsabilidad} – {f.codigo_empleado ?? f.codigo}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

