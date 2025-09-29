"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';

interface Props {
  url?: string;
  code?: string;
  children: React.ReactNode;
}

export function RequirePage({ url, code, children }: Props) {
  const { me, isLoading } = useSession();
  const router = useRouter();

  const allowed = (me?.pages ?? []).some((p: { path: string; code: string }) => {
    if (!p) return false;
    const matchesPath = url ? p.path === url || url.startsWith(`${p.path}/`) : true;
    const matchesCode = code ? p.code === code : true;
    return matchesPath && matchesCode;
  });

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace('/403');
    }
  }, [allowed, isLoading, router]);

  if (isLoading || !allowed) return null;

  return <>{children}</>;
}

export default RequirePage;
