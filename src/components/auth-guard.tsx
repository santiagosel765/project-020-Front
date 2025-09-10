"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const { me, loading } = useSession();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    const userRoles: string[] = me?.roles ?? [];
    if (me && (!roles || roles.some((r) => userRoles.includes(r)))) {
      setAuthorized(true);
    } else {
      router.replace('/');
    }
  }, [loading, me, roles, router]);

  if (!authorized) return null;

  return <>{children}</>;
}
