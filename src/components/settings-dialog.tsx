
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger as DialogPrimitiveTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, PenLine, Trash2, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { SignaturePad } from './signature-pad';
import type SignatureCanvas from 'react-signature-canvas';
import Image from 'next/image';
import { Input } from './ui/input';
import { useSession } from '@/lib/session';
import { api } from '@/lib/api';
import { buildUserFormData, updateUser } from '@/services/usersService';
import { UserAvatar } from '@/components/avatar/user-avatar';

const SettingsDialogContext = React.createContext({
    setOpen: (open: boolean) => {}
});

const SettingsDialogRoot = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
    const [open, setOpen] = useState(false);
    return (
        <SettingsDialogContext.Provider value={{ setOpen }}>
            <Dialog open={open} onOpenChange={setOpen} {...props}>
                {children}
            </Dialog>
        </SettingsDialogContext.Provider>
    )
}

const SettingsDialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitiveTrigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitiveTrigger>
>(({ ...props }, ref) => {
  const { setOpen } = React.useContext(SettingsDialogContext);
  return (
    <div onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <DialogPrimitiveTrigger {...props} ref={ref} asChild/>
    </div>
  );
});
SettingsDialogTrigger.displayName = DialogPrimitiveTrigger.displayName;


export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');
  const [userRole, setUserRole] = useState<string | null>(null);
  const { roles, signatureUrl, refresh, me } = useSession();
  const { toast } = useToast();

  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const signatureUploadRef = useRef<HTMLInputElement>(null);

  const profileImageUploadRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const { setOpen } = React.useContext(SettingsDialogContext);


  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    const role = roles.includes('ADMIN')
      ? 'admin'
      : roles.includes('SUPERVISOR')
        ? 'supervisor'
        : 'general';
    setUserRole(role);

    if (signatureUrl) {
      setCurrentSignature(signatureUrl);
    } else {
      const savedSignature = localStorage.getItem('userSignature');
      if (savedSignature) {
        setCurrentSignature(savedSignature);
      }
    }
  }, [roles, signatureUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    setAvatarPreview(me?.avatarUrl ?? null);
  }, [me?.avatarUrl]);

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const handleSaveSignature = async () => {
    if (!signatureCanvasRef.current) return;
    if (signatureCanvasRef.current.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Lienzo Vacío',
        description: 'Por favor, dibuje su firma antes de guardar.',
      });
      return;
    }
    const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
    try {
      await api.patch('/users/me/signature', { dataUrl });
      setCurrentSignature(dataUrl);
      toast({
        title: 'Firma Guardada',
        description: 'Su nueva firma ha sido guardada exitosamente.',
      });
      await refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la firma.',
      });
    }
  };

  const handleClearSignature = () => {
    signatureCanvasRef.current?.clear();
  };
  
  const handleSignatureUploadClick = () => {
    signatureUploadRef.current?.click();
  };
  
  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        await api.patch('/users/me/signature', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setCurrentSignature(URL.createObjectURL(file));
        toast({
          title: 'Firma Actualizada',
          description: 'Su firma ha sido actualizada desde el archivo.',
        });
        await refresh();
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo actualizar la firma.',
        });
      }
    }
  };

  const handleProfileImageUploadClick = () => {
    profileImageUploadRef.current?.click();
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !me?.id) {
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setIsUpdatingAvatar(true);

    try {
      const formData = buildUserFormData({}, file);
      await updateUser(Number(me.id), formData);
      toast({ title: 'Foto actualizada' });
      await refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la foto de perfil.',
      });
      setAvatarPreview(me?.avatarUrl ?? null);
    } finally {
      setIsUpdatingAvatar(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleAvatarRemove = async () => {
    if (!me?.id) return;
    setIsUpdatingAvatar(true);
    setAvatarPreview(null);
    try {
      const formData = buildUserFormData({ urlFoto: '' });
      await updateUser(Number(me.id), formData);
      toast({ title: 'Foto eliminada' });
      await refresh();
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la foto de perfil.',
      });
      setAvatarPreview(me?.avatarUrl ?? null);
    } finally {
      setIsUpdatingAvatar(false);
      if (profileImageUploadRef.current) {
        profileImageUploadRef.current.value = '';
      }
    }
  };


  if (!mounted) {
    return null;
  }

  const canManageSignature = userRole === 'admin' || userRole === 'general';

  return (
    <>
    <SettingsDialogRoot>
      <DialogPrimitiveTrigger asChild>
          {children}
      </DialogPrimitiveTrigger>
      <DialogContent className="sm:max-w-[480px] glassmorphism flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Personalice su perfil y preferencias de la plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 flex-1 overflow-y-auto pr-6 pl-1 -mr-6">
          <div className="flex items-center gap-4">
            <UserAvatar size="lg" url={avatarPreview ?? me?.avatarUrl ?? null} name={me?.nombre ?? 'Usuario'} />
            <div className="flex-grow space-y-2">
              <Label>Foto de perfil</Label>
              <p className="text-xs text-muted-foreground">
                Selecciona una imagen para actualizar tu foto de perfil.
              </p>
              <Input
                type="file"
                accept="image/*"
                ref={profileImageUploadRef}
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleProfileImageUploadClick} disabled={isUpdatingAvatar}>
                  {isUpdatingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Cambiar foto
                </Button>
                {(avatarPreview || me?.avatarUrl) && (
                  <Button type="button" variant="ghost" onClick={handleAvatarRemove} disabled={isUpdatingAvatar}>
                    {isUpdatingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Quitar foto
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Modo Oscuro</Label>
              <p className="text-xs text-muted-foreground">
                Cambie entre el tema claro y oscuro.
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
          </div>
          <div className="space-y-3">
            <Label>Notificación por WhatsApp</Label>
             <p className="text-xs text-muted-foreground">
                Ingrese el número de teléfono al cual se enviarán las notificaciones.
            </p>
            <Input placeholder="Ingrese su número de teléfono" />
          </div>
          
          {canManageSignature && (
            <>
            <Separator/>
            <div className="space-y-4">
                <Label className='text-base'>Gestión de Firma</Label>
                <div className='space-y-2'>
                    <Label className='text-sm'>Firma Actual</Label>
                    <div className='w-full h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/50'>
                       <Image src={signatureUrl ?? currentSignature ?? '/placeholder-signature.png'} alt="Firma actual" width={200} height={100} style={{objectFit: 'contain'}} />
                    </div>
                </div>
                <Tabs defaultValue="draw">
                    <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value="draw"><PenLine className="mr-2 h-4 w-4"/> Dibujar Firma</TabsTrigger>
                        <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/> Subir Imagen</TabsTrigger>
                    </TabsList>
                    <TabsContent value="draw" className="space-y-2">
                        <SignaturePad ref={signatureCanvasRef} />
                        <div className='flex gap-2 justify-end'>
                            <Button variant="ghost" size="sm" onClick={handleClearSignature}><Trash2 className='mr-2 h-4 w-4'/> Limpiar</Button>
                            <Button size="sm" onClick={handleSaveSignature}>Guardar Firma Dibujada</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="upload">
                        <div className="flex items-center justify-center w-full">
                            <Label
                                htmlFor="signature-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastre</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 800x400px)</p>
                                </div>
                                <input ref={signatureUploadRef} id="signature-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleSignatureFileChange} />
                            </Label>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            </>
          )}

        </div>
        <DialogFooter className="border-t pt-4">
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </SettingsDialogRoot>
    </>
  );
}

// We need to stop the propagation of the event from the DropdownMenuItem
// to prevent the dropdown from closing when the dialog is opened.
SettingsDialog.Trigger = SettingsDialogTrigger;
