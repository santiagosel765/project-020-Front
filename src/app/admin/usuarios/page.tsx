'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { usePaginationState } from '@/hooks/usePaginationState';

export default function UsuariosPage() {
  const { toast } = useToast();
  const { page, limit, sort, search, setPage, setLimit, setSearch } = usePaginationState({
    defaultLimit: 10,
    defaultSort: 'desc',
  });
  const [searchInput, setSearchInput] = useState(() => search);
  const initialSearchRef = useRef(search);
  const isFirstSearchEffect = useRef(true);

  useEffect(() => {
    initialSearchRef.current = search;
    setSearchInput((current) => (current === search ? current : search));
    isFirstSearchEffect.current = true;
  }, [search]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (isFirstSearchEffect.current) {
        isFirstSearchEffect.current = false;
        if (searchInput === initialSearchRef.current) {
          return;
        }
      }
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handler);
  }, [searchInput, setPage, setSearch]);

  const usersQuery = useQuery({
    queryKey: ['users', { page, limit, sort, search }],
    queryFn: async () => {
      const params: GetUsersParams = { page, limit, sort, search };
      const result = await getUsers(params);
      return result;
    },
    keepPreviousData: true,
    retry: false,
  });

  useEffect(() => {
    if (!usersQuery.error) return;
    toast({
      variant: 'destructive',
      title: 'Error al cargar usuarios',
      description: 'No se pudieron obtener los datos de los usuarios.',
    });
  }, [toast, usersQuery.error]);

  const isInitialLoading = usersQuery.isPending && !usersQuery.data;

  const handleSaveUser = async ({ data, file }: { data: User; file?: File | null }) => {
    try {
      const formData = buildUserFormData(data, file ?? null);
      if (!data.id) {
        await createUser(formData);
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' });
        if (page !== 1) {
          setPage(1);
        } else {
          await usersQuery.refetch();
        }
      } else {
        await updateUser(Number(data.id), formData);
        toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' });
        await usersQuery.refetch();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudo guardar el usuario.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(Number(userId));
      toast({ variant: 'destructive', title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado.' });
      await usersQuery.refetch();
    } catch {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: 'No se pudo eliminar el usuario.' });
    }
  };

  if (isInitialLoading) {
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

  const payload = usersQuery.data;

  return (
    <UsersTable
      data={payload}
      onPageChange={setPage}
      onLimitChange={setLimit}
      searchTerm={searchInput}
      onSearchChange={setSearchInput}
      onSaveUser={handleSaveUser}
      onDeleteUser={handleDeleteUser}
      loading={usersQuery.isFetching}
    />
  );
}
