"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Loader2 } from "lucide-react";
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
  roleId: z.string().optional(),
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
  roleId: "",
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
    const initialRoleId = roleIds.length > 0 ? String(roleIds[0]) : "";

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
          roleId: initialRoleId,
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
    if (!isOpen || !rolesCatalog.length) {
      return;
    }

    const currentRoleId = form.getValues("roleId");
    if (currentRoleId) {
      return;
    }

    const userRoles = Array.isArray(user?.roles) ? user.roles : [];
    const firstRole = userRoles.find((role) => role && role.id != null);
    if (!firstRole) {
      return;
    }

    const roleId =
      typeof firstRole.id === "number" ? firstRole.id : Number(firstRole.id);

    if (Number.isFinite(roleId) && rolesCatalog.some((role) => role.id === roleId)) {
      form.setValue("roleId", String(roleId));
    }
  }, [form, isOpen, rolesCatalog, user]);

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
      roleIds: data.roleId ? [Number(data.roleId)] : [],
    };
    await onSave(payload, selectedFile);
  };

  const handleFileChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      onChange: (value: string | null | undefined) => void,
    ) => {
      const file = event.target.files?.[0] ?? null;

      if (file) {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
        onChange(objectUrl);
      } else {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onChange(null);
      }
    },
    [previewUrl],
  );

  const handleRemovePhoto = useCallback(
    (onChange: (value: string | null | undefined) => void) => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onChange(null);
    },
    [previewUrl],
  );

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
      <DialogContent className="glassmorphism flex flex-col">
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
                <FormField
                  control={form.control}
                  name="urlFoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Foto de Perfil</FormLabel>
                      <FormControl>
                        <section className="grid grid-cols-1 place-items-center gap-3 py-2">
                          <Avatar className="h-32 w-32">
                            <AvatarImage src={previewUrl ?? undefined} alt="Foto de perfil" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Subir foto
                            </Button>
                            {previewUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleRemovePhoto(field.onChange)}
                              >
                                Quitar foto
                              </Button>
                            )}
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => handleFileChange(event, field.onChange)}
                          />
                        </section>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            disabled={isLoadingCatalogs}
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
                            disabled={isLoadingCatalogs}
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
                      name="roleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rol</FormLabel>
                          <Select
                            disabled={isLoadingCatalogs}
                            onValueChange={field.onChange}
                            value={field.value ? field.value : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingCatalogs
                                      ? "Cargando…"
                                      : rolesCatalog.length > 0
                                      ? "Seleccione un rol"
                                      : "No hay roles disponibles"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCatalogs ? (
                                <SelectItem value="__role_loading" disabled>
                                  Cargando…
                                </SelectItem>
                              ) : rolesCatalog.length ? (
                                rolesCatalog.map((role) => (
                                  <SelectItem key={role.id} value={String(role.id)}>
                                    {role.nombre}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="__role_empty" disabled>
                                  No hay roles disponibles
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
