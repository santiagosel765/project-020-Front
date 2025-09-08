
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: FormValues) => void;
  user?: User;
}

const formSchema = z.object({
  id: z.string().optional(),
  employeeCode: z.string().min(1, 'El código es requerido.'),
  name: z.string().min(1, 'El nombre es requerido.'),
  position: z.string().min(1, 'El puesto es requerido.'),
  username: z.string().min(1, 'El usuario es requerido.'),
  email: z.string().email('Correo inválido.'),
  phone: z.string().regex(/^\d{8}$/, 'El teléfono debe tener 8 dígitos.'),
  department: z.string().min(1, 'La gerencia es requerida'),
  notificationType: z.literal('Whatsapp'),
  role: z.enum(['Admin', 'General', 'Supervisor']),
  avatar: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

const defaultUserValues: FormValues = {
  employeeCode: '',
  name: '',
  position: '',
  username: '',
  email: '',
  phone: '',
  department: '',
  notificationType: 'Whatsapp',
  role: 'General',
  avatar: `https://placehold.co/100x100.png`,
};

export function UserFormModal({ isOpen, onClose, onSubmit, user }: UserFormModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: user ? { ...user, notificationType: 'Whatsapp' } : defaultUserValues,
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(user ? { ...user, notificationType: 'Whatsapp' } : defaultUserValues);
    }
  }, [isOpen, user, form]);


  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glassmorphism flex flex-col sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {user ? 'Actualice los detalles del usuario.' : 'Complete los detalles para crear un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Ana María García López" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employeeCode"
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
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Usuario de Red</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: agarcia" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Puesto</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: CEO" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Gerencia</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Dirección" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
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
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono para Notificaciones por WhatsApp</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: 55550101" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-6 border-t -mx-6 px-6 -mb-6 pb-6 bg-background/95 z-10">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
