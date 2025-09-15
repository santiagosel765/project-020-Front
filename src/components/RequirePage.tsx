"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';

interface Props {
  url: string;
  children: React.ReactNode;
}

export function RequirePage({ url, children }: Props) {
  const { me, isLoading } = useSession();
  const router = useRouter();

  const allowed = me?.pages?.some((p: { path: string }) => p.path === url);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace('/403');
    }
  }, [isLoading, allowed, router]);

  if (isLoading || !allowed) return null;

  return <>{children}</>;
}

export default RequirePage;
