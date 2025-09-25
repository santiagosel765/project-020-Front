// @ts-nocheck
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
import type { Page } from "@/services/pageService";

export type PageForm = Pick<Page, "id" | "nombre" | "url" | "descripcion">;

interface PageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (page: PageForm) => Promise<void> | void;
  page?: PageForm;
}

const formSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, "El nombre es requerido."),
  url: z.string().min(1, "La URL es requerida."),
  descripcion: z.string().optional(),
});

const defaultValues: PageForm = { nombre: "", url: "", descripcion: "" } as PageForm;

export function PageFormModal({ isOpen, onClose, onSave, page }: PageFormModalProps) {
  const form = useForm<PageForm>({
    resolver: zodResolver(formSchema),
    defaultValues: page ?? defaultValues,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      form.reset(page ?? defaultValues);
    }
  }, [isOpen, page, form]);

  const handleSubmit = async (data: PageForm) => {
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
          <DialogTitle>{page ? "Editar Página" : "Crear Página"}</DialogTitle>
          <DialogDescription>
            {page
              ? "Actualice los detalles de la página."
              : "Complete los campos para crear una nueva página."}
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
                    <Input placeholder="Nombre de la página" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="/ruta" {...field} />
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
                    <Input placeholder="Descripción" {...field} />
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

