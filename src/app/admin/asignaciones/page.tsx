"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Upload, Search, Loader2 } from "lucide-react";
import { getUsers, getMe } from "@/services/usersService";
import type { User } from "@/lib/data";
import { createCuadroFirma } from "@/services/documentsService";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


type Signatory = Omit<User, 'id'> & { id: number; responsibility: 'REVISA' | 'APRUEBA' | 'ENTERADO' | null };

const toNumericId = (raw: unknown): number | null => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return null;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0] ? parts[0][0].toUpperCase() : "";
};

export default function AsignacionesPage() {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getUsers();
        const list = Array.isArray(data) ? data : [];
        if (mounted) setUsers(list);
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error al cargar usuarios",
          description: "No fue posible obtener la lista de usuarios.",
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const base = users.filter((u) => {
      const nid = toNumericId((u as any).id ?? (u as any).userId ?? (u as any).uid);
      return (
        nid != null &&
        (u.name.toLowerCase().includes(term) ||
          u.position.toLowerCase().includes(term) ||
          u.department.toLowerCase().includes(term)) &&
        !signatories.some((s) => s.id === nid)
      );
    });
    base.sort((a, b) => a.name.localeCompare(b.name));
    return term ? base : base.slice(0, 5);
  }, [users, searchTerm, signatories]);

  const addSignatory = (user: User) => {
    const nid = toNumericId((user as any).id ?? (user as any).userId ?? (user as any).uid);
    if (nid == null) {
      toast({ variant: 'destructive', title: 'Usuario sin ID', description: `No se pudo usar a ${user.name}` });
      return;
    }
    const asSign: Signatory = { ...user, id: nid, responsibility: null };
    setSignatories((prev) => [...prev, asSign].sort((a, b) => a.name.localeCompare(b.name)));
    setSearchTerm('');
  };

  const removeSignatory = (userId: number) => {
    setSignatories((prev) => prev.filter((s) => s.id !== userId));
  };

  const handleResponsibilityChange = (userId: number, value: 'REVISA' | 'APRUEBA' | 'ENTERADO') => {
    setSignatories((prev) => prev.map((s) => (s.id === userId ? { ...s, responsibility: value } : s)));
  };

  const handlePdfUploadClick = () => {
    pdfInputRef.current?.click();
  };

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfFileName(file.name);
      toast({ title: "Archivo Seleccionado", description: `Se ha cargado el archivo: ${file.name}.` });
    } else {
      setPdfFile(null);
      setPdfFileName(null);
      toast({ variant: "destructive", title: "Archivo no válido", description: "Seleccione un PDF." });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!pdfFile) {
      toast({ variant: "destructive", title: "Falta el archivo PDF", description: "Cargue un PDF para continuar." });
      setIsLoading(false);
      return;
    }

    try {
      const me = await getMe();
      const form = event.target as HTMLFormElement;
      const title = (form.elements.namedItem("title") as HTMLInputElement).value;
      const meta = {
        titulo: title,
        descripcion: documentContent,
        version: (form.elements.namedItem("version") as HTMLInputElement).value,
        codigo: (form.elements.namedItem("code") as HTMLInputElement).value,
        empresa_id: 1,
        createdBy: me.id,
      };
      const responsables: any = {
        ELABORA: [{ idUser: me.id }],
        REVISA: signatories
          .filter((s) => s.responsibility === 'REVISA')
          .map((s) => ({ idUser: s.id })),
        APRUEBA: signatories
          .filter((s) => s.responsibility === 'APRUEBA')
          .map((s) => ({ idUser: s.id })),
        ENTERADO: signatories
          .filter((s) => s.responsibility === 'ENTERADO')
          .map((s) => ({ idUser: s.id })),
      };

      try {
        await createCuadroFirma({ file: pdfFile, meta, responsables });
      } catch (error: any) {
        const status = error?.response?.status;
        const msg = String(error?.response?.data?.message ?? '');
        if (status === 409 || msg.toLowerCase().includes('código')) {
          toast({
            variant: 'destructive',
            title: 'Código en uso',
            description: 'Ya existe un documento con ese código. Cambia el código y vuelve a intentar.',
          });
          document.getElementById('code')?.focus();
          return;
        }
        throw error;
      }
      toast({ title: "Documento Enviado", description: "El documento se envió para firma." });

      setSignatories([]);
      setDocumentContent("");
      setPdfFile(null);
      setPdfFileName(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      form.reset();
    } catch (error) {
      console.error("Document creation error:", error);
      toast({
        variant: "destructive",
        title: "Error de Creación",
        description: "Hubo un problema al crear el documento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = useMemo(() => {
    if (isLoading || signatories.length === 0 || !pdfFile) return true;
    const hasAllResponsibilities = signatories.every((s) => s.responsibility);
    if (!hasAllResponsibilities) return true;
    const hasRevisa = signatories.some((s) => s.responsibility === "REVISA");
    const hasAprueba = signatories.some((s) => s.responsibility === "APRUEBA");
    return !(hasRevisa && hasAprueba);
  }, [isLoading, signatories, pdfFile]);

  return (
    <div className="container mx-auto h-full -mt-8">
      <form onSubmit={handleSubmit} className="h-full">
        <Card className="w-full h-full flex flex-col glassmorphism">
          <CardHeader>
            <CardTitle>Nueva Asignación de Documento</CardTitle>
            <CardDescription>Complete la información del documento y agregue los firmantes necesarios.</CardDescription>
          </CardHeader>

          <CardContent className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-y-auto p-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Descripción General</h3>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" placeholder="Ej: Contrato de Servicios Anual" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción detallada del propósito del documento."
                    required
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ingreso de Codificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Versión</Label>
                    <Input id="version" placeholder="Ej: 1.0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input id="code" name="code" placeholder="Ej: F-RH-001" required />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Archivo y Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Seleccione el Archivo PDF</Label>
                    <Input type="file" ref={pdfInputRef} onChange={handlePdfFileChange} className="hidden" accept="application/pdf" />
                    <Button type="button" variant="outline" className="w-full" onClick={handlePdfUploadClick}>
                      <Upload className="mr-2 h-4 w-4" />
                      {pdfFileName ? pdfFileName : "Cargar PDF"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Seleccione la Empresa</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {["FGE", "Corporativo", "Pronet", "Asogénesis", "Desarrollo en Movimiento", "FUNTEC", "MAC"].map((empresa) => (
                          <SelectItem key={empresa} value={empresa}>
                            {empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4 flex flex-col">
              <h3 className="text-lg font-medium">Firmantes</h3>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, puesto..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-md max-h-56 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Puesto</TableHead>
                      <TableHead>Gerencia</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.position}</TableCell>
                        <TableCell className="text-muted-foreground">{user.department}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" onClick={() => addSignatory(user)}>
                            Agregar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-2" />

              <h4 className="text-sm font-medium">Firmantes Seleccionados ({signatories.length}):</h4>
              {signatories.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center py-4">No hay firmantes agregados.</p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Responsabilidad</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signatories.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            <RadioGroup
                              onValueChange={(value) => handleResponsibilityChange(user.id, value as any)}
                              value={user.responsibility ?? undefined}
                              className="flex gap-2 md:gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="REVISA" id={`r1-${user.id}`} />
                                <Label htmlFor={`r1-${user.id}`} className="text-xs">
                                  Revisa
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="APRUEBA" id={`r2-${user.id}`} />
                                <Label htmlFor={`r2-${user.id}`} className="text-xs">
                                  Aprueba
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ENTERADO" id={`r3-${user.id}`} />
                                <Label htmlFor={`r3-${user.id}`} className="text-xs">
                                  Enterado
                                </Label>
                              </div>
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeSignatory(user.id)}>
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-auto pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Enviando..." : "Enviar Documento"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
