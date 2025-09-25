"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
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
import type { Role } from "@/services/roleService";

export type RoleForm = {
  id?: string;
  nombre: string;
  descripcion?: string;
};

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: RoleForm) => Promise<void> | void;
  role?: Role | null;
}

const formSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido."),
  descripcion: z.string().optional(),
});

const defaultValues: RoleForm = { nombre: "", descripcion: "" };

export function RoleFormModal({ isOpen, onClose, onSave, role }: RoleFormModalProps) {
  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const values: RoleForm = role
        ? {
            id: role.id != null ? String(role.id) : undefined,
            nombre: role.nombre ?? "",
            descripcion: role.descripcion ?? "",
          }
        : { ...defaultValues };
      form.reset(values);
    }
  }, [isOpen, role, form]);

  const handleSubmit = async (data: RoleForm) => {
    setLoading(true);
    try {
      await onSave(data);
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as any)?.message;
        if (message) {
          form.setError("nombre", { type: "server", message });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphism">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Crear Rol"}</DialogTitle>
          <DialogDescription>
            {role ? "Actualice los detalles del rol." : "Complete los campos para crear un nuevo rol."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del rol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del rol" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

