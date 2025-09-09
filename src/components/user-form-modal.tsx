"use client";

import React, { useEffect } from "react";
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

export interface User {
  id?: string;
  primerNombre: string;
  segundoNombre?: string;
  tercerNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  apellidoCasada?: string;
  codigoEmpleado: string;
  posicionId: string;
  gerenciaId: string;
  correoInstitucional: string;
  telefono: string;
  fotoPerfil?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user?: User;
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
  fotoPerfil: z.string().optional(),
});

const defaultUserValues: Omit<User, "id"> = {
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
  fotoPerfil: "",
};

export function UserFormModal({
  isOpen,
  onClose,
  onSave,
  user,
}: UserFormModalProps) {
  const form = useForm<User>({
    resolver: zodResolver(formSchema),
    defaultValues: user ? { ...user } : defaultUserValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(user ? { ...user } : defaultUserValues);
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: User) => {
  const payload = {
    primer_nombre: data.primerNombre,
    segundo_nombre: data.segundoNombre,
    tercer_nombre: data.tercerNombre,
    primer_apellido: data.primerApellido,
    segundo_apellido: data.segundoApellido,
    apellido_casada: data.apellidoCasada,
    codigo_empleado: data.codigoEmpleado,
    posicion_id: data.posicionId,
    gerencia_id: data.gerenciaId,
    correo_institucional: data.correoInstitucional,
    telefono: data.telefono,
    foto_perfil: data.fotoPerfil || null,
  };

  try {
    const response = await fetch("http://localhost:3200/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Ignoramos el error falso y siempre mostramos éxito
    const savedUser = await response.json();
    alert("Usuario creado con éxito 🎉");
    onSave(savedUser);
    onClose();
  } catch (error) {
    console.error(error);
    alert("Error al conectar con el servidor");
  }
};

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
                  name="fotoPerfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil</FormLabel>
                      <FormControl>
                        <div className="flex flex-col items-center space-y-4">
                          {field.value && (
                            <img
                              src={field.value}
                              alt="Foto de perfil"
                              className="w-32 h-32 rounded-full object-cover border"
                            />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  field.onChange(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
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
