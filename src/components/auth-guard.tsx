"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useSession } from '@/lib/session';
import { getInitialRoute } from '@/lib/routes/getInitialRoute';

interface AuthGuardProps {
  children: React.ReactNode;
  pagePath?: string;
  pageCode?: string;
  fallback?: string;
}

export function AuthGuard({ children, pagePath, pageCode, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { me, isLoading } = useSession();

  const hasAccess = useMemo(() => {
    if (!me) return false;
    if (!pagePath && !pageCode) return true;

    return (me.pages ?? []).some((page) => {
      if (!page) return false;
      const matchesPath = pagePath
        ? page.path === pagePath || pagePath.startsWith(`${page.path}/`)
        : true;
      const matchesCode = pageCode ? page.code === pageCode : true;
      return matchesPath && matchesCode;
    });
  }, [me, pageCode, pagePath]);

  useEffect(() => {
    if (isLoading) return;
    if (!me) {
      router.replace('/');
      return;
    }
    if (!hasAccess) {
      const destination = getInitialRoute(me.pages ?? [], fallback);
      // TODO: Replace fallback when backend provides a dedicated redirect target for unauthorized pages.
      router.replace(destination);
    }
  }, [fallback, hasAccess, isLoading, me, router]);

  if (isLoading) return null;
  if (!me) return null;
  if (!hasAccess) return null;

  return <>{children}</>;
}
