"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, UserPlus, Edit, Trash2, FileUp, KeyRound } from 'lucide-react';
import { User } from '@/lib/data';
import { UserFormModal } from './user-form-modal';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { UserPasswordDialog } from './user-password-dialog';
import { useSession } from '@/lib/session';
import { PaginationBar } from './pagination/PaginationBar';
import type { PageEnvelope } from '@/lib/pagination';
import { Switch } from '@/components/ui/switch';
import { CardList } from './responsive/card-list';
import { FiltersBar, FilterChips, type FilterChip } from './filters/filters-bar';
import { FiltersDrawer } from './filters/filters-drawer';
import { cn } from '@/lib/utils';

interface UsersTableProps {
  data?: PageEnvelope<User>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  includeInactive: boolean;
  onToggleInactive: (checked: boolean) => void;
  onSaveUser: (payload: { data: User; file?: File | null }) => Promise<void> | void;
  onDeleteUser: (userId: string) => void;
  loading?: boolean;
}

const getFullName = (u: User) =>
  `${u.primerNombre} ${u.segundoNombre ?? ''} ${u.tercerNombre ?? ''} ${u.primerApellido} ${u.segundoApellido ?? ''} ${u.apellidoCasada ?? ''}`.trim();

const getInitials = (u: User) => {
  const fullName = getFullName(u).split(' ');
  if (fullName.length > 1) return `${fullName[0][0]}${fullName[1][0]}`.toUpperCase();
  return fullName[0] ? fullName[0][0].toUpperCase() : '';
};

export function UsersTable({
  data,
  onPageChange,
  onLimitChange,
  searchTerm,
  onSearchChange,
  includeInactive,
  onToggleInactive,
  onSaveUser,
  onDeleteUser,
  loading = false,
}: UsersTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { me } = useSession();
  const [passwordDialogUser, setPasswordDialogUser] = useState<{ user: User; requireCurrent: boolean } | null>(null);

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const hasPrev = Boolean(data?.hasPrev);
  const hasNext = Boolean(data?.hasNext);
  const currentLimit = data?.limit ?? 10;

  const handleOpenModal = (user?: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(undefined);
  };

  const handleSaveUser = async (user: User, file?: File | null) => {
    await onSaveUser({ data: user, file });
    handleCloseModal();
  };

  const handleDeleteUser = (userId: string) => {
    onDeleteUser(userId);
  };

  const handleChangePassword = (user: User) => {
    const isSelf = me?.id != null && String(me.id) === String(user.id ?? '');
    setPasswordDialogUser({ user, requireCurrent: isSelf });
  };

  const handleBulkUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Archivo Seleccionado",
        description: `Se ha seleccionado el archivo: ${file.name}. La funcionalidad de carga aún no está implementada.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderFilters = (variant: 'bar' | 'drawer') => {
    const isDrawer = variant === 'drawer';

    return (
      <>
        <div
          className={cn(
            'relative flex-1 min-w-[200px] md:max-w-xs',
            isDrawer && 'w-full',
          )}
        >
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            className={cn('pl-8', isDrawer && 'w-full')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div
          className={cn(
            'flex items-center gap-2',
            isDrawer && 'w-full justify-between rounded-lg border p-3',
          )}
        >
          <div className="flex items-center gap-2">
            <Switch id="show-inactive" checked={includeInactive} onCheckedChange={onToggleInactive} />
            <label htmlFor="show-inactive" className="text-sm">
              Mostrar inactivos
            </label>
          </div>
        </div>
      </>
    );
  };

  const filterChips: FilterChip[] = [];
  if (searchTerm.trim()) {
    filterChips.push({
      id: 'search',
      label: `Búsqueda: "${searchTerm}"`,
      onRemove: () => onSearchChange(''),
    });
  }
  if (includeInactive) {
    filterChips.push({
      id: 'inactive',
      label: 'Mostrar inactivos',
      onRemove: () => onToggleInactive(false),
    });
  }

  return (
    <>
      <Card className="w-full h-full flex flex-col glassmorphism">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <CardTitle>Gestión de Usuarios ({total})</CardTitle>
                <CardDescription>Cree, edite y gestione los usuarios de la plataforma.</CardDescription>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <FiltersDrawer renderFilters={renderFilters} chips={filterChips} />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  />
                  <Button variant="outline" onClick={handleBulkUploadClick}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Carga Masiva
                  </Button>
                  <Button onClick={() => handleOpenModal()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Nuevo
                  </Button>
                </div>
              </div>
            </div>
            <FiltersBar renderFilters={renderFilters} chips={filterChips} />
            <FilterChips chips={filterChips} className="md:hidden" />
          </div>
        </CardHeader>

        <CardContent className="flex-grow overflow-auto">
          <div className="md:hidden space-y-4">
            <CardList
              items={users}
              primary={(user) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.urlFoto || user.fotoPerfil || user.avatar || undefined}
                      alt={getFullName(user)}
                    />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>{getFullName(user)}</div>
                </div>
              )}
              secondary={(user) => (
                <div className="flex flex-col gap-2">
                  {Array.isArray(user.roles) && user.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={`${user.id}-card-role-${role.id}`} variant="secondary" className="text-xs">
                          {role.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={user.activo ? "secondary" : "outline"} className="text-xs">
                      {user.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              )}
              meta={(user) => (
                <span className="break-all text-muted-foreground">{user.correoInstitucional || '—'}</span>
              )}
              actions={(user) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Cambiar contraseña</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteUser(user.id!)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
            {!loading && users.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No hay usuarios.</p>
            )}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead className="hidden md:table-cell">Posición</TableHead>
                  <TableHead className="hidden lg:table-cell">Gerencia</TableHead>
                  <TableHead className="hidden md:table-cell">Código de Empleado</TableHead>
                  <TableHead className="hidden xl:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden xl:table-cell">Correo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.urlFoto || user.fotoPerfil || user.avatar || undefined}
                          alt={getFullName(user)}
                        />
                        <AvatarFallback>{getInitials(user)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{getFullName(user)}</div>
                      {Array.isArray(user.roles) && user.roles.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={`${user.id}-role-${role.id}`} variant="secondary" className="text-xs">
                              {role.nombre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.posicionNombre?.trim()
                        ? user.posicionNombre
                        : user.posicionId != null && String(user.posicionId).trim() !== ''
                        ? String(user.posicionId)
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.gerenciaNombre?.trim()
                        ? user.gerenciaNombre
                        : user.gerenciaId != null && String(user.gerenciaId).trim() !== ''
                        ? String(user.gerenciaId)
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.codigoEmpleado}</TableCell>
                    <TableCell className="hidden xl:table-cell">{user.telefono}</TableCell>
                    <TableCell className="hidden xl:table-cell">{user.correoInstitucional}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            <span>Cambiar contraseña</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(user.id!)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4 text-center text-sm text-muted-foreground">
                      No hay usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      <PaginationBar
        total={total}
        page={currentPage}
        pages={totalPages}
        limit={currentLimit}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={(u, file) => handleSaveUser(u as User, file)}
        user={selectedUser}
      />
      <UserPasswordDialog
        open={!!passwordDialogUser}
        onOpenChange={(open) => {
          if (!open) setPasswordDialogUser(null);
        }}
        userId={passwordDialogUser?.user.id}
        userName={passwordDialogUser ? getFullName(passwordDialogUser.user) : undefined}
        requireCurrent={passwordDialogUser?.requireCurrent ?? false}
      />
    </>
  );
}
