"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Search, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { SignersTable } from "@/components/signers-table";
import SelectedSigners from "@/components/assignments/SelectedSigners";
import { getUsers } from "@/services/usersService";
import { useCompanies } from "@/services/companiesService";
import type { User } from "@/lib/data";
import { buildResponsables } from "@/lib/responsables";
import { useSession } from "@/lib/session";

const toNumericId = (raw: unknown): number | null => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return null;
};

type Responsibility = "ELABORA" | "REVISA" | "APRUEBA" | "ENTERADO";

type Signatory = {
  id: number;
  name: string;
  responsibility: Responsibility | null;
};

export type AssignmentFormInitialValues = {
  title?: string | null;
  description?: string | null;
  version?: string | null;
  code?: string | null;
  companyId?: number | string | null;
  companyName?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  observaciones?: string | null;
  responsables?: {
    id: number;
    nombre: string;
    responsabilidad: Responsibility | null;
    responsabilidadId: number | null;
  }[];
  elaboraUserId?: number | null;
};

export type AssignmentFormSubmitData = {
  title: string;
  description: string;
  version: string;
  code: string;
  companyId: number;
  responsables: ReturnType<typeof buildResponsables>;
  pdfFile: File | null;
  observaciones: string;
  hasFileChange: boolean;
  signatories: Signatory[];
};

export interface AssignmentFormProps {
  mode: "create" | "edit";
  initialValues?: AssignmentFormInitialValues | null;
  onSubmit: (data: AssignmentFormSubmitData) => Promise<void>;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export function AssignmentForm({
  mode,
  initialValues,
  onSubmit,
  submitLabel,
  title: headingTitle,
  description: headingDescription,
}: AssignmentFormProps) {
  const { toast } = useToast();
  const { me } = useSession();

  const companiesParams = useMemo(() => (mode === "create" ? { activo: true } : undefined), [mode]);
  const {
    data: companiesData,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
  } = useCompanies(companiesParams);
  const companies = companiesData?.items ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [version, setVersion] = useState(initialValues?.version ?? "");
  const [code, setCode] = useState(initialValues?.code ?? "");
  const [companyId, setCompanyId] = useState<string | undefined>(() => {
    if (initialValues?.companyId != null && String(initialValues.companyId).trim() !== "") {
      return String(initialValues.companyId);
    }
    return undefined;
  });
  const [observaciones, setObservaciones] = useState(initialValues?.observaciones ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(initialValues?.pdfName ?? null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(initialValues?.pdfUrl ?? null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(initialValues?.pdfName ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elaboraId, setElaboraId] = useState<number | null>(initialValues?.elaboraUserId ?? null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const normalizedInitialCompanyId =
    initialValues?.companyId != null && String(initialValues.companyId).trim() !== ""
      ? String(initialValues.companyId)
      : undefined;

  const companyOptions = useMemo(() => {
    const base = companies.map((empresa) => ({
      id: empresa.id,
      nombre: empresa.nombre,
    }));

    if (!normalizedInitialCompanyId) {
      return base;
    }

    const exists = base.some((empresa) => String(empresa.id) === normalizedInitialCompanyId);
    if (exists) return base;

    const parsed = Number(normalizedInitialCompanyId);
    if (!Number.isFinite(parsed)) return base;

    const name =
      typeof initialValues?.companyName === "string" && initialValues.companyName.trim() !== ""
        ? initialValues.companyName
        : `Empresa ${normalizedInitialCompanyId}`;

    return [
      ...base,
      {
        id: parsed,
        nombre: name,
      },
    ];
  }, [companies, normalizedInitialCompanyId, initialValues?.companyName]);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title ?? "");
      setDescription(initialValues.description ?? "");
      setVersion(initialValues.version ?? "");
      setCode(initialValues.code ?? "");
      setCompanyId(
        initialValues.companyId != null && String(initialValues.companyId).trim() !== ""
          ? String(initialValues.companyId)
          : undefined,
      );
      setObservaciones(initialValues.observaciones ?? "");
      setExistingPdfName(initialValues.pdfName ?? null);
      setExistingPdfUrl(initialValues.pdfUrl ?? null);
      setPdfFileName(initialValues.pdfName ?? null);
      setElaboraId((prev) => initialValues.elaboraUserId ?? prev ?? null);
      if (Array.isArray(initialValues.responsables)) {
        setSignatories(
          initialValues.responsables.map((r) => ({
            id: r.id,
            name: r.nombre,
            responsibility: r.responsabilidad,
          })),
        );
      }
    }
  }, [initialValues]);

  useEffect(() => {
    if (me?.id && !elaboraId) {
      setElaboraId(Number(me.id));
    }
  }, [me?.id, elaboraId]);

  useEffect(() => {
    if (mode !== "create") return;
    if (companyId != null && companyId !== "") return;
    if (!companies.length) return;
    setCompanyId(String(companies[0].id));
  }, [mode, companies, companyId]);

  useEffect(() => {
    if (!isCompaniesError) return;
    toast({
      variant: "destructive",
      title: "Error al cargar empresas",
      description: "No fue posible obtener la lista de empresas.",
    });
  }, [isCompaniesError, toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { items } = await getUsers({ page: 1, limit: 200, sort: "desc", includeInactive: true });
        if (mounted) setUsers(items);
      } catch (err) {
        if (!mounted) return;
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
  }, [toast]);

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
    return base;
  }, [users, searchTerm, signatories]);

  const addSignatory = (user: User) => {
    const nid = toNumericId((user as any).id ?? (user as any).userId ?? (user as any).uid);
    if (nid == null) {
      toast({ variant: "destructive", title: "Usuario sin ID", description: `No se pudo usar a ${user.name}` });
      return;
    }
    setSignatories((prev) =>
      [...prev, { id: nid, name: user.name, responsibility: null }].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setSearchTerm("");
  };

  const removeSignatory = (userId: number) => {
    setSignatories((prev) => prev.filter((s) => s.id !== userId));
  };

  const handleResponsibilityChange = (userId: number, value: Responsibility) => {
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
      setPdfFileName(existingPdfName);
      toast({ variant: "destructive", title: "Archivo no válido", description: "Seleccione un PDF." });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVersion("");
    setCode("");
    setCompanyId(companies.length > 0 ? String(companies[0].id) : undefined);
    setObservaciones("");
    setSignatories([]);
    setPdfFile(null);
    setPdfFileName(null);
    setExistingPdfName(null);
    setExistingPdfUrl(null);
    setSearchTerm("");
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const hasPdfSelected = mode === "edit" ? Boolean(pdfFile || existingPdfName) : Boolean(pdfFile);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    if (!hasPdfSelected) return true;
    if (!title.trim() || !description.trim() || !version.trim() || !code.trim()) return true;
    if (signatories.length === 0) return true;
    const hasAllResponsibilities = signatories.every((s) => s.responsibility);
    if (!hasAllResponsibilities) return true;
    const hasRevisa = signatories.some((s) => s.responsibility === "REVISA");
    const hasAprueba = signatories.some((s) => s.responsibility === "APRUEBA");
    if (!(hasRevisa && hasAprueba)) return true;
    return false;
  }, [isSubmitting, hasPdfSelected, title, description, version, code, signatories]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!elaboraId) {
      toast({
        variant: "destructive",
        title: "Usuario no identificado",
        description: "No fue posible determinar el usuario actual.",
      });
      return;
    }

    if (!hasPdfSelected) {
      toast({
        variant: "destructive",
        title: "Falta el archivo PDF",
        description: "Cargue un PDF para continuar.",
      });
      return;
    }

    setIsSubmitting(true);

    const responsables = buildResponsables({
      elaboraUserId: elaboraId,
      revisaUserIds: signatories.filter((s) => s.responsibility === "REVISA").map((s) => s.id),
      apruebaUserIds: signatories.filter((s) => s.responsibility === "APRUEBA").map((s) => s.id),
    });

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        version: version.trim(),
        code: code.trim(),
        companyId: Number(companyId) || 0,
        responsables,
        pdfFile,
        observaciones: observaciones.trim(),
        hasFileChange: Boolean(pdfFile),
        signatories,
      });

      if (mode === "create") {
        resetForm();
      } else if (pdfFile) {
        setExistingPdfName(pdfFile.name);
        setExistingPdfUrl(null);
        if (pdfInputRef.current) {
          pdfInputRef.current.value = "";
        }
        setPdfFile(null);
      }
    } catch (error) {
      console.error("Assignment form submit error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const heading = headingTitle ?? (mode === "edit" ? "Editar Asignación" : "Nueva Asignación de Documento");
  const descriptionText =
    headingDescription ??
    (mode === "edit"
      ? "Actualice la información del documento y los responsables asignados."
      : "Complete la información del documento y agregue los firmantes necesarios.");

  return (
    <form onSubmit={handleSubmit} className="h-full">
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
          <CardDescription>{descriptionText}</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow grid grid-cols-1 xl:grid-cols-2 gap-8 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Descripción General</h3>
              <div className="space-y-2">
                <Label htmlFor="assignment-title">Título</Label>
                <Input
                  id="assignment-title"
                  placeholder="Ej: Contrato de Servicios Anual"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-description">Descripción</Label>
                <Textarea
                  id="assignment-description"
                  placeholder="Descripción detallada del propósito del documento."
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ingreso de Codificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-version">Versión</Label>
                  <Input
                    id="assignment-version"
                    placeholder="Ej: 1.0"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-code">Código</Label>
                  <Input
                    id="assignment-code"
                    placeholder="Ej: F-RH-001"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Archivo y Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Seleccione el Archivo PDF</Label>
                  <Input
                    type="file"
                    ref={pdfInputRef}
                    onChange={handlePdfFileChange}
                    className="hidden"
                    accept="application/pdf"
                  />
                  <Button type="button" variant="outline" className="w-full" onClick={handlePdfUploadClick}>
                    <Upload className="mr-2 h-4 w-4" />
                    {pdfFileName ? pdfFileName : "Cargar PDF"}
                  </Button>
                  {mode === "edit" && existingPdfName && !pdfFile && (
                    <p className="text-xs text-muted-foreground">
                      Archivo actual:{" "}
                      {existingPdfUrl ? (
                        <a
                          href={existingPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          {existingPdfName}
                        </a>
                      ) : (
                        <span>{existingPdfName}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignment-company">Seleccione la Empresa</Label>
                  <Select
                    required
                    disabled={isCompaniesLoading}
                    value={companyId}
                    onValueChange={(value) => {
                      setCompanyId(value);
                    }}
                  >
                    <SelectTrigger id="assignment-company">
                      <SelectValue
                        placeholder={isCompaniesLoading ? "Cargando empresas…" : "Seleccionar empresa"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companyOptions.length ? (
                        companyOptions.map((empresa) => (
                          <SelectItem key={empresa.id} value={String(empresa.id)}>
                            {empresa.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empresa_placeholder" disabled>
                          {isCompaniesLoading ? "Cargando empresas…" : "Sin empresas disponibles"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-observaciones">Observaciones</Label>
                <Textarea
                  id="assignment-observaciones"
                  placeholder="Notas u observaciones adicionales."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
          </div>

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

            <SignersTable users={filteredUsers} onAdd={addSignatory} />

            <Separator className="my-2" />

            <SelectedSigners
              selected={signatories.map((signer) => ({
                id: signer.id,
                nombre: signer.name,
                responsabilidad: signer.responsibility,
              }))}
              onRemove={(id) => removeSignatory(Number(id))}
            />

            {signatories.length === 0 ? (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay firmantes agregados.
                </p>
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
                    {signatories.map((user) => {
                      const isElabora = user.responsibility === "ELABORA";
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            {isElabora ? (
                              <span className="text-xs font-semibold uppercase text-muted-foreground">Elabora</span>
                            ) : (
                              <RadioGroup
                                onValueChange={(value) =>
                                  handleResponsibilityChange(user.id, value as Responsibility)
                                }
                                value={user.responsibility ?? undefined}
                                className="flex flex-wrap gap-2 md:flex-nowrap md:gap-4"
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
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSignatory(user.id)}
                              disabled={isElabora}
                            >
                              Quitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-auto pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : submitLabel ?? (mode === "edit" ? "Guardar Cambios" : "Enviar Documento")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default AssignmentForm;
