"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import React from "react";
import { apiFetch, saveTokens, decodeJwt } from "@/lib/api";

const formSchema = z.object({
  username: z.string().min(1, { message: "El usuario es requerido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // 🔑 el backend espera "user" (correo o código) y "password"
      const data = await apiFetch<{ access_token: string; refresh_token?: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ user: values.username, password: values.password }),
        }
      );

      saveTokens(data.access_token, data.refresh_token);

      // Decide a dónde redirigir: /users/me o decodificando el token
      // Opción A: decodificar rápidamente el JWT
      const payload = decodeJwt<{ roles?: string[] }>(data.access_token);
      const roles = payload?.roles ?? [];

      toast({ title: "Inicio de sesión exitoso" });

      if (roles.includes('ADMIN')) {
        router.push('/admin/asignaciones');
      } else if (roles.includes('SUPERVISOR')) {
        router.push('/admin/supervision');
      } else {
        router.push('/general');
      }

      // Opción B (alternativa): consultar /users/me
      // const me = await apiFetch<any>('/users/me');
      // const roles = me?.rol_usuario?.map((r:any)=> r?.rol?.nombre) ?? [];
      // if (roles.includes('ADMIN')) router.push('/admin/asignaciones');
      // else if (roles.includes('SUPERVISOR')) router.push('/admin/supervision');
      // else router.push('/general');

    } catch (error: any) {
      console.error("Login API error:", error);
      const msg = typeof error?.message === 'string' ? error.message : 'Error de autenticación';
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input placeholder="Correo institucional o código" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </Form>
  );
}
