"use client";

import { GeneralHeader } from "@/components/general-header";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { useSession } from "@/lib/session";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    const roles: string[] = me?.roles ?? [];
    if (roles.includes('ADMIN')) {
      router.replace('/admin/asignaciones');
    } else if (roles.includes('SUPERVISOR')) {
      router.replace('/admin/supervision');
    }
  }, [loading, me, router]);

  const isDocumentDetailPage = pathname.startsWith('/documento/');

  if (isDocumentDetailPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <GeneralHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
