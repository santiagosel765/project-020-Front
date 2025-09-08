"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMeOnce } from '@/services/userService';

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMeOnce()
      .then((user) => {
        const userRoles: string[] = user?.roles ?? [];
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
