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

  const signOut = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearToken()
      queryClient.removeQueries({ queryKey: ['me'] })
    }
  }

  return {
    me: data,
    isLoading,
    error,
    refresh: refetch,
    roles: data?.roles ?? [],
    pages: data?.pages ?? [],
    signatureUrl: data?.signatureUrl ?? null,
    hasSignature: data?.hasSignature ?? false,
    avatarUrl: data?.urlFoto ?? null,
    email: data?.correo ?? null,
    displayName: data?.nombre ?? null,
    isAdmin: !!data?.roles?.includes('ADMIN'),
    isSupervisor: !!data?.roles?.includes('SUPERVISOR'),
    signOut,
  }
}
