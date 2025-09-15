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
  const { me, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace('/');
      return;
    }
    if (roles && !(me.roles ?? []).some((r: string) => roles.includes(r))) {
      router.replace('/');
    }
  }, [isLoading, me, roles, router]);

  if (isLoading) return null;
  if (!me) return null;
  if (roles && !(me.roles ?? []).some((r: string) => roles.includes(r))) return null;

  return <>{children}</>;
}
