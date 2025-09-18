'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UsersTable } from '@/components/users-table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  buildUserFormData,
  type GetUsersParams,
} from '@/services/usersService';
import type { User } from '@/lib/data';
import { useServerPagination } from '@/hooks/useServerPagination';

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const { page, limit, setPage, setLimit, setFromMeta } = useServerPagination();

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handler);
  }, [searchInput, setPage]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetUsersParams = { page, limit };
      if (search) params.search = search;
      const { items, meta } = await getUsers(params);
      setTotal(meta.total ?? 0);
      if (meta.pages > 0 && page > meta.pages) {
        setFromMeta(meta);
        return;
      }
      setUsers(items);
      setFromMeta(meta);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error al cargar usuarios',
        description: 'No se pudieron obtener los datos de los usuarios.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, search, setFromMeta, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveUser = async ({ data, file }: { data: User; file?: File | null }) => {
    try {
      const formData = buildUserFormData(data, file ?? null);
      if (!data.id) {
        await createUser(formData);
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' });
        if (page !== 1) {
          setPage(1);
        } else {
          await fetchUsers();
        }
      } else {
        await updateUser(Number(data.id), formData);
        toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' });
        await fetchUsers();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el usuario.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(Number(userId));
      toast({ variant: 'destructive', title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado.' });
      await fetchUsers();
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo eliminar el usuario.' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <UsersTable
      users={users}
      total={total}
      page={page}
      pageSize={limit}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onSaveUser={handleSaveUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}

