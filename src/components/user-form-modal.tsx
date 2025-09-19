"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ChevronDown } from "lucide-react";
import type { CatalogoItem, UiUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromFullName } from "@/lib/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  getPosiciones,
  getGerencias,
  getRoles as getRolesCatalog,
  type UserFormPayload,
} from "@/services/usersService";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserFormPayload, file?: File | null) => Promise<void> | void;
  user?: UiUser;
}

const formSchema = z.object({
  id: z.string().optional(),
  primerNombre: z.string().min(1, "El primer nombre es requerido."),
  segundoNombre: z.string().optional(),
  tercerNombre: z.string().optional(),
  primerApellido: z.string().min(1, "El primer apellido es requerido."),
  segundoApellido: z.string().optional(),
  apellidoCasada: z.string().optional(),
  codigoEmpleado: z.string().min(1, "El código de empleado es requerido."),
  posicionId: z.string().min(1, "La posición es requerida."),
  gerenciaId: z.string().min(1, "La gerencia es requerida."),
  correoInstitucional: z.string().email("Debe ser un correo válido."),
  telefono: z.string().regex(/^\d{8}$/, "El teléfono debe tener 8 dígitos."),
  roleIds: z.array(z.number()).default([]),
  urlFoto: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultUserValues: FormValues = {
  id: undefined,
  primerNombre: "",
  segundoNombre: "",
  tercerNombre: "",
  primerApellido: "",
  segundoApellido: "",
  apellidoCasada: "",
  codigoEmpleado: "",
  posicionId: "",
  gerenciaId: "",
  correoInstitucional: "",
  telefono: "",
  roleIds: [],
  urlFoto: null,
};

export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  user,
}: UserFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultUserValues,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posiciones, setPosiciones] = useState<CatalogoItem[]>([]);
  const [gerencias, setGerencias] = useState<CatalogoItem[]>([]);
  const [rolesCatalog, setRolesCatalog] = useState<CatalogoItem[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const url = user?.urlFoto ?? user?.fotoPerfil ?? null;
    setPreviewUrl(url);
    setSelectedFile(null);

    const currentRoles = Array.isArray(user?.roles) ? user?.roles ?? [] : [];
    const roleIds = currentRoles
      .map((role) => (typeof role?.id === "number" ? role.id : Number(role?.id)))
      .filter((id): id is number => Number.isFinite(id));

    const values: FormValues = user
      ? {
          id: user.id ?? undefined,
          primerNombre: user.primerNombre ?? "",
          segundoNombre: user.segundoNombre ?? "",
          tercerNombre: user.tercerNombre ?? "",
          primerApellido: user.primerApellido ?? "",
          segundoApellido: user.segundoApellido ?? "",
          apellidoCasada: user.apellidoCasada ?? "",
          codigoEmpleado: user.codigoEmpleado ?? "",
          posicionId: user.posicionId != null ? String(user.posicionId) : "",
          gerenciaId: user.gerenciaId != null ? String(user.gerenciaId) : "",
          correoInstitucional: user.correoInstitucional ?? "",
          telefono: user.telefono ?? "",
          roleIds,
          urlFoto: url,
        }
      : { ...defaultUserValues };

    form.reset(values);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen, user, form]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoadingCatalogs(true);

    (async () => {
      try {
        const [pos, ger, rol] = await Promise.all([
          getPosiciones({ all: 0 }),
          getGerencias({ all: 0 }),
          getRolesCatalog({ all: 0 }),
        ]);
        if (!active) return;
        setPosiciones(pos);
        setGerencias(ger);
        setRolesCatalog(rol);
      } catch (error) {
        console.error("Error al cargar catálogos de usuario", error);
      } finally {
        if (active) {
          setIsLoadingCatalogs(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (data: FormValues) => {
    const payload: UserFormPayload = {
      id: data.id,
      primerNombre: data.primerNombre,
      segundoNombre: data.segundoNombre,
      tercerNombre: data.tercerNombre,
      primerApellido: data.primerApellido,
      segundoApellido: data.segundoApellido,
      apellidoCasada: data.apellidoCasada,
      codigoEmpleado: data.codigoEmpleado,
      posicionId: data.posicionId ? Number(data.posicionId) : undefined,
      gerenciaId: data.gerenciaId ? Number(data.gerenciaId) : undefined,
      correoInstitucional: data.correoInstitucional,
      telefono: data.telefono,
      urlFoto: previewUrl ?? null,
      roleIds: Array.isArray(data.roleIds) ? data.roleIds : [],
    };
    await onSave(payload, selectedFile);
  };

  const [watchPrimerNombre, watchSegundoNombre, watchTercerNombre, watchPrimerApellido, watchSegundoApellido, watchApellidoCasada] =
    form.watch([
      "primerNombre",
      "segundoNombre",
      "tercerNombre",
      "primerApellido",
      "segundoApellido",
      "apellidoCasada",
    ]);

  const avatarFallback = useMemo(
    () =>
      initialsFromFullName(
        watchPrimerNombre,
        watchSegundoNombre,
        watchTercerNombre,
        watchPrimerApellido,
        watchSegundoApellido,
        watchApellidoCasada,
      ),
    [
      watchPrimerNombre,
      watchSegundoNombre,
      watchTercerNombre,
      watchPrimerApellido,
      watchSegundoApellido,
      watchApellidoCasada,
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphism flex flex-col max-w-4xl md:max-w-5xl h-full sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Actualice los detalles del usuario."
              : "Complete los detalles para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto pr-4 -mr-4">
              <div className="space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-3 flex items-center justify-center md:justify-start">
                    <Avatar className="h-28 w-28 md:h-32 md:w-32">
                      <AvatarImage src={previewUrl ?? undefined} alt="Foto de perfil" />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="md:col-span-6">
                    <FormField
                      control={form.control}
                      name="urlFoto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 block">Foto de Perfil</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  if (file) {
                                    const objectUrl = URL.createObjectURL(file);
                                    setPreviewUrl(objectUrl);
                                    setSelectedFile(file);
                                    field.onChange(objectUrl);
                                  } else {
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                    field.onChange(null);
                                  }
                                }}
                              />
                              {previewUrl && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                    field.onChange(null);
                                  }}
                                >
                                  Quitar foto
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3" />
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="codigoEmpleado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Empleado</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: EMP001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="posicionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posición</FormLabel>
                          <Select
                            disabled={isLoadingCatalogs && posiciones.length === 0}
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingCatalogs ? "Cargando posiciones..." : "Seleccione una posición"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {posiciones.length ? (
                                posiciones.map((posicion) => (
                                  <SelectItem key={posicion.id} value={String(posicion.id)}>
                                    {posicion.nombre}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="__posicion_placeholder" disabled>
                                  {isLoadingCatalogs ? "Cargando..." : "Sin posiciones disponibles"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gerenciaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gerencia</FormLabel>
                          <Select
                            disabled={isLoadingCatalogs && gerencias.length === 0}
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingCatalogs ? "Cargando gerencias..." : "Seleccione una gerencia"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gerencias.length ? (
                                gerencias.map((gerencia) => (
                                  <SelectItem key={gerencia.id} value={String(gerencia.id)}>
                                    {gerencia.nombre}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="__gerencia_placeholder" disabled>
                                  {isLoadingCatalogs ? "Cargando..." : "Sin gerencias disponibles"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="roleIds"
                      render={({ field }) => {
                        const selectedIds = Array.isArray(field.value) ? field.value : [];
                        const selectedRoles = selectedIds.map((id) => {
                          const found = rolesCatalog.find((role) => role.id === id);
                          return { id, nombre: found?.nombre ?? `ID ${id}` };
                        });

                        return (
                          <FormItem>
                            <FormLabel>Roles</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                    disabled={isLoadingCatalogs && rolesCatalog.length === 0}
                                  >
                                    <span className="truncate text-left">
                                      {selectedIds.length > 0
                                        ? `${selectedIds.length} rol${selectedIds.length === 1 ? "" : "es"} seleccionados`
                                        : isLoadingCatalogs
                                        ? "Cargando roles..."
                                        : "Seleccione roles"}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[260px] p-0" align="start">
                                  <div className="max-h-60 overflow-y-auto py-1">
                                    {rolesCatalog.length === 0 ? (
                                      <div className="px-3 py-2 text-sm text-muted-foreground">
                                        {isLoadingCatalogs ? (
                                          <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Cargando...
                                          </span>
                                        ) : (
                                          "No hay roles disponibles."
                                        )}
                                      </div>
                                    ) : (
                                      rolesCatalog.map((role) => {
                                        const isSelected = selectedIds.includes(role.id);
                                        return (
                                          <label
                                            key={role.id}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={(checked) => {
                                                const next =
                                                  checked === true
                                                    ? Array.from(new Set([...selectedIds, role.id]))
                                                    : selectedIds.filter((id) => id !== role.id);
                                                field.onChange(next);
                                              }}
                                              className="h-4 w-4"
                                            />
                                            <span className="flex-1 truncate">{role.nombre}</span>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            {selectedRoles.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {selectedRoles.map((role) => (
                                  <Badge key={role.id} variant="secondary">
                                    {role.nombre}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="correoInstitucional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Institucional</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: ana.garcia@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 55550101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primerNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primer Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Ana" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="segundoNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segundo Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: María" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tercerNombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tercer Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Isabel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="primerApellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primer Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="segundoApellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segundo Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: López" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apellidoCasada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido de Casada</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: de García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="pt-6 border-t -mx-6 px-6 -mb-6 pb-6 bg-background/95 z-10">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
