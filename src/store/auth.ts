import { useSession } from '@/lib/session';
import { getToken } from '@/lib/tokenStore';
import { fullName } from '@/lib/avatar';

export function useAuth() {
  const { me } = useSession();
  const token = getToken() || '';
  const signature = (me as any)?.signatureUrl ?? (me as any)?.url_firma;
  const currentUser = me
    ? {
        id: Number((me as any).id ?? 0),
        nombreCompleto: fullName(me as any),
        token,
        url_firma: signature ?? undefined,
        signatureUrl: signature ?? undefined,
        hasSignature: Boolean((me as any)?.hasSignature ?? !!signature),
      }
    : null;
  return { currentUser };
}

export type CurrentUser = ReturnType<typeof useAuth>['currentUser'];
