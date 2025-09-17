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
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFromFullName } from "@/lib/avatar";

type UserForm = Omit<User, "name" | "position" | "department">;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserForm, file?: File | null) => Promise<void> | void;
  user?: UserForm;
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
  urlFoto: z.string().optional().nullable(),
});

const defaultUserValues: Omit<UserForm, "id"> = {
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
  urlFoto: null,
};

export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  user,
}: UserFormModalProps) {
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: user ? { ...user } : defaultUserValues,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const url = user?.urlFoto ?? user?.fotoPerfil ?? null;
      setPreviewUrl(url);
      setSelectedFile(null);
      form.reset(user ? { ...user, urlFoto: url } : defaultUserValues);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen, user, form]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (data: UserForm) => {
    const payload = { ...data, urlFoto: previewUrl ?? null };
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
      <DialogContent className="glassmorphism flex flex-col sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh]">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-4 -mr-4">
              {/* Columna izquierda */}
              <div className="space-y-6">
                {/* Foto de perfil con preview */}
                <FormField
                  control={form.control}
                  name="urlFoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-4">
                          <Avatar className="h-32 w-32">
                            <AvatarImage src={previewUrl ?? undefined} alt="Foto de perfil" />
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                          </Avatar>
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

                {/* Nombres y Apellidos */}
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

              {/* Columna derecha */}
              <div className="space-y-6">
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
                      <FormLabel>Posición ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: POS123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gerenciaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gerencia ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: GER456" {...field} />
                      </FormControl>
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
                        <Input
                          placeholder="Ej: ana.garcia@example.com"
                          {...field}
                        />
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
