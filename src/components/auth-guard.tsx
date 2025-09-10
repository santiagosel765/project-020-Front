"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/lib/session';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const { me, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace('/');
      return;
    }
    if (roles && !(me.roles ?? []).some((r) => roles.includes(r))) {
      router.replace('/');
    }
  }, [loading, me, roles, router]);

  if (loading) return null;
  if (!me) return null;
  if (roles && !(me.roles ?? []).some((r) => roles.includes(r))) return null;

  return <>{children}</>;
}
