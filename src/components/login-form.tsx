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
import { login as authLogin } from "@/services/authService";
import { useSession } from "@/lib/session";

const formSchema = z.object({
  email: z.string().min(1, { message: "El correo es requerido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useSession();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await authLogin(values.email, values.password);
      toast({ title: "Inicio de sesión exitoso" });

      const me = await refresh();

      const preferred = [
        '/admin/asignaciones',
        '/admin/documentos',
        '/admin/mis-documentos',
        '/admin/usuarios',
        '/admin/roles',
        '/admin/page',
        '/admin/permission',
        '/admin/supervision',
      ];

      const allowed = me?.pages?.map((p: { path: string }) => p.path) ?? [];
      const dest = preferred.find(p => allowed.includes(p)) || '/general';

      router.push(dest);

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input placeholder="Correo institucional" {...field} />
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
