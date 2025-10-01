"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { User } from "@/lib/data";
import {
  buildResponsablesPayload,
  collectAllResponsables,
  getResponsabilidadIdForRole,
  type ResponsabilidadRole,
} from "@/lib/responsables";
import { useSession } from "@/lib/session";
import { useForm } from "react-hook-form";
import type { ResponsablesPayload } from "@/types/documents";

const toNumericId = (raw: unknown): number | null => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return null;
};

type Responsibility = ResponsabilidadRole;

type Signatory = {
  id: number;
  name: string;
  responsibility: Responsibility | null;
  responsabilidadId: number | null;
  userData?: any;
};

export type AssignmentFormInitialValues = {
  title?: string | null;
  description?: string | null;
  version?: string | null;
  code?: string | null;
  empresaId?: number | null;
  empresaNombre?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  observaciones?: string | null;
  responsables?: {
    id: number;
    nombre: string;
    responsabilidad: Responsibility | null;
    responsabilidadId: number | null;
    user?: any;
  }[];
  elaboraUserId?: number | null;
};

export type AssignmentFormSubmitData = {
  title: string;
  description: string;
  version: string;
  code: string;
  empresaId: number | null;
  responsables: ResponsablesPayload;
  pdfFile: File | null;
  observaciones: string;
  hasFileChange: boolean;
  signatories: Signatory[];
};

type NormalizedSignatories = {
  elabora: number | null;
  revisa: number[];
  aprueba: number[];
  enterado: number[];
};

const normalizeString = (value?: string | null) => (typeof value === "string" ? value.trim() : "");

const summarizeSignatories = (
  signers: Array<{ id: number; responsibility: Responsibility | null | undefined }>,
): NormalizedSignatories => {
  const revisa = new Set<number>();
  const aprueba = new Set<number>();
  const enterado = new Set<number>();
  let elabora: number | null = null;

  signers.forEach(({ id, responsibility }) => {
    if (!Number.isFinite(id)) return;
    switch (responsibility) {
      case "ELABORA":
        elabora = id;
        break;
      case "REVISA":
        revisa.add(id);
        break;
      case "APRUEBA":
        aprueba.add(id);
        break;
      case "ENTERADO":
        enterado.add(id);
        break;
      default:
        break;
    }
  });

  const toSortedArray = (set: Set<number>) => Array.from(set).sort((a, b) => a - b);

  return {
    elabora,
    revisa: toSortedArray(revisa),
    aprueba: toSortedArray(aprueba),
    enterado: toSortedArray(enterado),
  };
};

const arraysEqual = (a: number[], b: number[]) => a.length === b.length && a.every((value, index) => value === b[index]);

const areResponsablesEqual = (a: NormalizedSignatories, b: NormalizedSignatories) =>
  a.elabora === b.elabora &&
  arraysEqual(a.revisa, b.revisa) &&
  arraysEqual(a.aprueba, b.aprueba) &&
  arraysEqual(a.enterado, b.enterado);

const bumpVersionString = (value: string) => {
  const base = normalizeString(value);
  if (!base) return "1";
  const parts = base
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length === 0) return "1";
  const last = parts.pop()!;
  const incremented = String((parseInt(last, 10) || 0) + 1);
  return [...parts, incremented].join(".");
};

const isGreaterVersion = (a: string, b: string) => {
  const parse = (value: string) =>
    value
      .split(".")
      .map((part) => part.trim())
      .map((part) => (part === "" ? NaN : Number.parseInt(part, 10)))
      .filter((num) => Number.isFinite(num)) as number[];

  const versionA = parse(normalizeString(a));
  const versionB = parse(normalizeString(b));
  const maxLength = Math.max(versionA.length, versionB.length);

  for (let i = 0; i < maxLength; i += 1) {
    const valA = versionA[i] ?? 0;
    const valB = versionB[i] ?? 0;
    if (valA > valB) return true;
    if (valA < valB) return false;
  }

  return false;
};

export interface AssignmentFormProps {
  mode: "create" | "edit";
  initialValues?: AssignmentFormInitialValues | null;
  onSubmit: (data: AssignmentFormSubmitData) => Promise<void>;
  companies: { id: number; nombre: string }[];
  companiesLoading?: boolean;
  submitLabel?: string;
  title?: string;
  description?: string;
}

export function AssignmentForm({
  mode,
  initialValues,
  onSubmit,
  companies,
  companiesLoading,
  submitLabel,
  title: headingTitle,
  description: headingDescription,
}: AssignmentFormProps) {
  const { toast } = useToast();
  const { me } = useSession();

  const { watch, setValue, reset, getValues } = useForm<{ empresaId: number | null }>({
    defaultValues: { empresaId: initialValues?.empresaId ?? null },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [version, setVersion] = useState(initialValues?.version ?? "");
  const [code, setCode] = useState(initialValues?.code ?? "");
  const [observaciones, setObservaciones] = useState(initialValues?.observaciones ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfName, setExistingPdfName] = useState<string | null>(initialValues?.pdfName ?? null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(initialValues?.pdfUrl ?? null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(initialValues?.pdfName ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elaboraId, setElaboraId] = useState<number | null>(initialValues?.elaboraUserId ?? null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const empresaId = watch("empresaId");

  const initialResponsablesSummary = useMemo(() => {
    if (!initialValues) {
      return summarizeSignatories([]);
    }

    const baseList = (initialValues.responsables ?? []).map((responsable) => ({
      id: responsable.id,
      responsibility: responsable.responsabilidad ?? null,
    }));

    if (
      initialValues.elaboraUserId != null &&
      !baseList.some((responsable) => responsable.id === initialValues.elaboraUserId)
    ) {
      baseList.push({ id: initialValues.elaboraUserId, responsibility: "ELABORA" });
    }

    return summarizeSignatories(baseList);
  }, [initialValues]);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title ?? "");
      setDescription(initialValues.description ?? "");
      setVersion(initialValues.version ?? "");
      setCode(initialValues.code ?? "");
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
            responsibility: (r.responsabilidad ?? null) as Responsibility | null,
            responsabilidadId: r.responsabilidadId ?? null,
            userData: r.user ?? undefined,
          })),
        );
      }
    }
  }, [initialValues]);

  useEffect(() => {
    reset({ empresaId: initialValues?.empresaId ?? null });
  }, [initialValues?.empresaId, reset]);

  useEffect(() => {
    if (!empresaId && initialValues?.empresaId && companies?.length) {
      setValue("empresaId", initialValues.empresaId, { shouldDirty: false });
    }
  }, [empresaId, initialValues?.empresaId, companies?.length, setValue]);

  useEffect(() => {
    if (mode !== "create") return;
    if (empresaId) return;
    if (!companies?.length) return;
    setValue("empresaId", companies[0].id, { shouldDirty: false });
  }, [mode, companies, empresaId, setValue]);

  const companiesFixed = useMemo(() => {
    if (!Array.isArray(companies)) return [] as { id: number; nombre: string }[];
    if (!initialValues?.empresaId) return companies;
    const exists = companies.some((empresa) => empresa.id === initialValues.empresaId);
    if (exists) return companies;

    const nombre =
      typeof initialValues?.empresaNombre === "string" && initialValues.empresaNombre.trim() !== ""
        ? initialValues.empresaNombre
        : `Empresa #${initialValues.empresaId} (inactiva)`;

    return [{ id: initialValues.empresaId, nombre }, ...companies];
  }, [companies, initialValues?.empresaId, initialValues?.empresaNombre]);

  useEffect(() => {
    if (me?.id && !elaboraId) {
      setElaboraId(Number(me.id));
    }
  }, [me?.id, elaboraId]);

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

  useEffect(() => {
    if (!users.length) return;

    const byId = new Map<number, User>();
    users.forEach((user) => {
      const uid = toNumericId((user as any).id ?? (user as any).userId ?? (user as any).uid);
      if (uid != null) {
        byId.set(uid, user);
      }
    });

    setSignatories((prev) => {
      let changed = false;
      const next = prev.map((signer) => {
        if (signer.userData) return signer;
        const match = byId.get(signer.id);
        if (!match) return signer;
        changed = true;
        return { ...signer, userData: match };
      });
      return changed ? next : prev;
    });
  }, [users]);

  const resolveUserData = useCallback(
    (userId: number, fallbackName?: string) => {
      const currentSigner = signatories.find((signer) => signer.id === userId);
      if (currentSigner?.userData) return currentSigner.userData;

      const initialUser = initialValues?.responsables?.find((r) => r.id === userId)?.user;
      if (initialUser) return initialUser;

      const fromUsers = users.find(
        (user) => toNumericId((user as any).id ?? (user as any).userId ?? (user as any).uid) === userId,
      );
      if (fromUsers) return fromUsers;

      return { id: userId, nombre: fallbackName ?? currentSigner?.name ?? "" };
    },
    [initialValues?.responsables, signatories, users],
  );

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
      [...prev, { id: nid, name: user.name, responsibility: null, responsabilidadId: null, userData: user }].sort(
        (a, b) =>
          a.name.localeCompare(b.name),
      ),
    );
    setSearchTerm("");
  };

  const removeSignatory = (userId: number) => {
    setSignatories((prev) => prev.filter((s) => s.id !== userId));
    setElaboraId((prev) => (prev === userId ? null : prev));
  };

  const handleResponsibilityChange = (userId: number, value: Responsibility) => {
    const responsabilidadId = getResponsabilidadIdForRole(value);
    setSignatories((prev) =>
      prev.map((s) =>
        s.id === userId
          ? { ...s, responsibility: value, responsabilidadId }
          : s,
      ),
    );
    setElaboraId((prev) => {
      if (value === "ELABORA") return userId;
      if (prev === userId) return null;
      return prev;
    });
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
    if (companies.length > 0) {
      setValue("empresaId", companies[0].id, { shouldDirty: false });
    } else {
      setValue("empresaId", null, { shouldDirty: false });
    }
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
    if (empresaId == null) return true;
    if (signatories.length === 0) return true;
    const hasAllResponsibilities = signatories.every((s) => s.responsibility);
    if (!hasAllResponsibilities) return true;
    const hasRevisa = signatories.some((s) => s.responsibility === "REVISA");
    const hasAprueba = signatories.some((s) => s.responsibility === "APRUEBA");
    if (!(hasRevisa && hasAprueba)) return true;
    return false;
  }, [isSubmitting, hasPdfSelected, title, description, version, code, signatories, empresaId]);

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

    const currentEmpresaId = getValues("empresaId");
    if (currentEmpresaId == null) {
      toast({
        variant: "destructive",
        title: "Empresa requerida",
        description: "Seleccione una empresa para continuar.",
      });
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCode = code.trim();
    const trimmedObservaciones = observaciones.trim();
    let finalVersion = version.trim();
    const hasFileChange = Boolean(pdfFile);

    let autoVersionApplied = false;

    if (mode === "edit" && initialValues) {
      const currentResponsablesSummary = summarizeSignatories(signatories);
      const metaChanged =
        trimmedTitle !== normalizeString(initialValues.title) ||
        trimmedDescription !== normalizeString(initialValues.description) ||
        trimmedCode !== normalizeString(initialValues.code) ||
        currentEmpresaId !== (initialValues.empresaId ?? null) ||
        trimmedObservaciones !== normalizeString(initialValues.observaciones);
      const responsablesChanged = !areResponsablesEqual(currentResponsablesSummary, initialResponsablesSummary);
      const initialVersionValue = normalizeString(initialValues.version);
      const versionChanged = finalVersion !== initialVersionValue;
      const hasChanges = metaChanged || responsablesChanged || hasFileChange || versionChanged;

      if (hasChanges && !isGreaterVersion(finalVersion, initialVersionValue)) {
        const auto = bumpVersionString(initialVersionValue);
        setVersion(auto);
        finalVersion = auto;
        autoVersionApplied = true;
      }
    }

    if (autoVersionApplied) {
      toast({
        title: "Versión actualizada",
        description: `Se incrementó automáticamente la versión a ${finalVersion} para reflejar los cambios.`,
      });
    }

    setIsSubmitting(true);

    const selectedResponsables: Parameters<
      typeof buildResponsablesPayload
    >[0]["seleccionados"] = signatories.map((signer) => {
      const role = signer.responsibility;
      const resolvedUser = resolveUserData(signer.id, signer.name);
      const responsabilidadId =
        signer.responsabilidadId != null
          ? signer.responsabilidadId
          : role
          ? getResponsabilidadIdForRole(role)
          : null;

      if (!role || responsabilidadId == null) {
        throw Object.assign(new Error(`Falta responsabilidad para ${signer.name}`), {
          name: "AssignmentValidationError",
        });
      }

      return {
        user: resolvedUser,
        responsabilidadId,
        role,
        responsabilidadNombre: role,
        fallbackNombre: signer.name,
      };
    });

    try {
      const responsables = buildResponsablesPayload({
        seleccionados: selectedResponsables,
        elaboraUserId: elaboraId,
      });

      const faltantes = Array.from(
        new Set(
          collectAllResponsables(responsables)
            .filter((responsable) => !responsable.puesto || !responsable.gerencia)
            .map((responsable) => responsable.nombre),
        ),
      );

      if (faltantes.length > 0) {
        toast({
          variant: "destructive",
          title: "Información faltante",
          description: `Falta puesto/gerencia para ${faltantes.join(", ")}`,
        });
        return;
      }

      await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription,
        version: finalVersion,
        code: trimmedCode,
        empresaId: currentEmpresaId,
        responsables,
        pdfFile,
        observaciones: trimmedObservaciones,
        hasFileChange,
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
    } catch (error: any) {
      if (error?.name === "AssignmentValidationError") {
        toast({
          variant: "destructive",
          title: "Información faltante",
          description: error?.message ?? "Verifica los datos de los responsables.",
        });
        return;
      }
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
                    disabled={companiesLoading}
                    value={empresaId != null ? String(empresaId) : ""}
                    onValueChange={(value) => {
                      const parsed = Number(value);
                      setValue("empresaId", Number.isFinite(parsed) ? parsed : null, { shouldDirty: true });
                    }}
                  >
                    <SelectTrigger id="assignment-company">
                      <SelectValue
                        placeholder={
                          companiesLoading ? "Cargando empresas…" : "Seleccionar empresa"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {companiesFixed.length ? (
                        companiesFixed.map((empresa) => (
                          <SelectItem key={empresa.id} value={String(empresa.id)}>
                            {empresa.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__empresa_placeholder" disabled>
                          {companiesLoading ? "Cargando empresas…" : "Sin empresas disponibles"}
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
