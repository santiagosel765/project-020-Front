'use client'

import React, { useState, useEffect } from 'react'
import { UsersTable } from '@/components/users-table'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/usersService'
import type { User } from '@/lib/data'

/** Convierte el shape del backend (snake_case) a tu modelo UI (camelCase) */
const toUiUser = (u: any): User => {
  const ui: any = {
    // ids como string para tu tabla
    id: String(u.id ?? u.user_id ?? ''),

    // nombres
    primerNombre: u.primer_nombre ?? u.primerNombre ?? '',
    segundoNombre: u.segundo_name ?? u.segundoNombre ?? '',
    tercerNombre: u.tercer_nombre ?? u.tercerNombre ?? '',
    primerApellido: u.primer_apellido ?? u.primerApellido ?? '',
    segundoApellido: u.segundo_apellido ?? u.segundoApellido ?? '',
    apellidoCasada: u.apellido_casada ?? u.apellidoCasada ?? '',

    // contacto / laborales
    correoInstitucional: u.correo_institucional ?? u.correoInstitucional ?? '',
    codigoEmpleado: u.codigo_empleado ?? u.codigoEmpleado ?? '',
    telefono: u.telefono ?? '',

    // relaciones (numérico o null/undefined, según tu interfaz)
    posicionId: u.posicion_id ?? u.posicionId ?? null,
    gerenciaId: u.gerencia_id ?? u.gerenciaId ?? null,

    // estado
    activo: u.activo ?? true,

    // multimedia / preferencias (ajústalos a tu interfaz si existen)
    fotoPerfil: u.foto_perfil ?? null,
    imagenFirma: u.imagen_firma ?? null,
    configTema: u.config_tema ?? null,
  }

  // nombre completo si tu `User` requiere `name`
  ui.name = [
    ui.primerNombre,
    ui.segundoNombre,
    ui.tercerNombre,
    ui.primerApellido,
    ui.segundoApellido,
    ui.apellidoCasada,
  ]
    .filter(Boolean)
    .join(' ')

  // Sugerencia del propio TS: castear a unknown primero
  return ui as unknown as User
}


export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const getFullName = (u: User) =>
    [u.primerNombre, u.segundoNombre, u.tercerNombre, u.primerApellido, u.segundoApellido, u.apellidoCasada]
      .filter(Boolean)
      .join(' ')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers()
        const ui = Array.isArray(data) ? data.map(toUiUser) : []
        setUsers(ui.sort((a, b) => getFullName(a).localeCompare(getFullName(b))))
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar usuarios',
          description: 'No se pudieron obtener los datos de los usuarios.',
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [toast])

  const handleSaveUser = async (user: User) => {
    try {
      if (!user.id) {
        const created = await createUser(user as any)
        const saved = toUiUser(created)
        setUsers((prev) => [...prev, saved].sort((a, b) => getFullName(a).localeCompare(getFullName(b))))
        toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido agregado exitosamente.' })
      } else {
        const updated = await updateUser(Number(user.id), user as any)
        const saved = toUiUser(updated)
        setUsers((prev) =>
          prev
            .map((u) => (String(u.id) === String(saved.id) ? saved : u))
            .sort((a, b) => getFullName(a).localeCompare(getFullName(b))),
        )
        toast({ title: 'Usuario Actualizado', description: 'Los datos del usuario han sido actualizados.' })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'Hubo un problema al guardar los datos del usuario.',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(Number(userId))
      setUsers((prev) => prev.filter((u) => String(u.id) !== String(userId)))
      toast({ variant: 'destructive', title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'Hubo un problema al eliminar el usuario.',
      })
    }
  }

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
    )
  }

  return (
    <div className="h-full">
      <UsersTable users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} />
    </div>
  )
}
