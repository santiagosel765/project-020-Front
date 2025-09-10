"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';

interface Props {
  url: string;
  children: React.ReactNode;
}

export function RequirePage({ url, children }: Props) {
  const { me, loading } = useSession();
  const router = useRouter();

  const allowed = me?.pages?.some((p) => p.url === url);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace('/403');
    }
  }, [loading, allowed, router]);

  if (loading || !allowed) return null;

  return <>{children}</>;
}

export default RequirePage;
