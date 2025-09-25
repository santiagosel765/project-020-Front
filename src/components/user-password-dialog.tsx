"use client";

import React, { useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { changeUserPassword } from "@/services/usersService";
import { useToast } from "@/hooks/use-toast";

interface UserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | number;
  userName?: string;
  requireCurrent?: boolean;
}

type PasswordFormValues = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

export function UserPasswordDialog({
  open,
  onOpenChange,
  userId,
  userName,
  requireCurrent = false,
}: UserPasswordDialogProps) {
  const { toast } = useToast();

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().optional(),
          newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
          confirmPassword: z.string().min(8, "Confirme la nueva contraseña."),
        })
        .superRefine((data, ctx) => {
          if (requireCurrent && !data.currentPassword) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["currentPassword"],
              message: "La contraseña actual es requerida.",
            });
          }
          if (data.newPassword !== data.confirmPassword) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["confirmPassword"],
              message: "Las contraseñas no coinciden.",
            });
          }
        }),
    [requireCurrent],
  );

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      form.clearErrors();
    }
  }, [open, form]);

  useEffect(() => {
    form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    form.clearErrors();
  }, [requireCurrent, form]);

  const onSubmit = async (values: PasswordFormValues) => {
    if (!userId) return;
    try {
      const payload: { currentPassword?: string; newPassword: string } = {
        newPassword: values.newPassword,
      };
      if (requireCurrent && values.currentPassword) {
        payload.currentPassword = values.currentPassword;
      }
      await changeUserPassword(Number(userId), payload);
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se ha actualizado correctamente.",
      });
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onOpenChange(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "No se pudo actualizar la contraseña.";
      toast({
        variant: "destructive",
        title: "Error",
        description: Array.isArray(message) ? message.join(" ") : String(message),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            {userName
              ? `Actualiza la contraseña para ${userName}.`
              : "Actualiza la contraseña del usuario seleccionado."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {requireCurrent && (
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Nueva contraseña" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirmar contraseña" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar contraseña
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
