"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMe } from '@/services/userService';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        const userRoles: string[] = user?.roles ??
          user?.rol_usuario?.map((r: any) => r?.rol?.nombre) ?? [];
        if (!roles || roles.some((r) => userRoles.includes(r))) {
          if (mounted) setAuthorized(true);
        } else {
          router.replace('/');
        }
      })
      .catch(() => router.replace('/'));
    return () => { mounted = false; };
  }, [router, roles]);

  if (!authorized) return null;

  return <>{children}</>;
}
