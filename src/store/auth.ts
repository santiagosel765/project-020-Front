import { useSession } from '@/lib/session';
import { getToken } from '@/lib/tokenStore';
import { fullName } from '@/lib/avatar';

export function useAuth() {
  const { me } = useSession();
  const token = getToken() || '';
  const currentUser = me
    ? {
        id: Number((me as any).id ?? 0),
        nombreCompleto: fullName(me as any),
        token,
        url_firma: (me as any).url_firma ?? undefined,
      }
    : null;
  return { currentUser };
}

export type CurrentUser = ReturnType<typeof useAuth>['currentUser'];
