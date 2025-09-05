
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import React from "react";
import api from "@/lib/api";

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
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const { data } = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      if (data?.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
          const userRole = data.user.role.toLowerCase();
          localStorage.setItem('userRole', userRole);
          toast({ title: "Inicio de sesión exitoso", description: `Bienvenido, ${data.user.name}.` });

          if (userRole === 'admin') {
            router.push('/admin/asignaciones');
          } else if (userRole === 'supervisor') {
            router.push('/admin/supervision');
          } else {
            router.push('/general');
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: data?.message || "Credenciales incorrectas. Por favor, inténtelo de nuevo.",
        });
      }
    } catch (error) {
      console.error("Login API error:", error);
      toast({
        variant: "destructive",
        title: "Error de red",
        description: "No se pudo conectar con el servidor de autenticación.",
      });
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
                <Input placeholder="Ingrese su usuario" {...field} />
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
