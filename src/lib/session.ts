import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { clearToken } from './tokenStore'
import type { MeResponseDto } from '@/types/me'

export function useSession() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<MeResponseDto>('/users/me')).data,
    staleTime: 5 * 60 * 1000,
  })

  const meWithAvatar = data
    ? { ...data, avatarUrl: data.avatarUrl ?? data.urlFoto ?? null }
    : data

  const signOut = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearToken()
      queryClient.removeQueries({ queryKey: ['me'] })
    }
  }

  return {
    me: meWithAvatar,
    isLoading,
    error,
    refresh: refetch,
    roles: meWithAvatar?.roles ?? [],
    pages: meWithAvatar?.pages ?? [],
    signatureUrl: meWithAvatar?.signatureUrl ?? null,
    hasSignature: meWithAvatar?.hasSignature ?? false,
    avatarUrl: meWithAvatar?.avatarUrl ?? null,
    email: meWithAvatar?.correo ?? null,
    displayName: meWithAvatar?.nombre ?? null,
    isAdmin: !!meWithAvatar?.roles?.includes('ADMIN'),
    isSupervisor: !!meWithAvatar?.roles?.includes('SUPERVISOR'),
    signOut,
  }
}
