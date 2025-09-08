
"use client";

import { GeneralHeader } from "@/components/general-header";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { getMeOnce } from "@/services/userService";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    getMeOnce()
      .then((user) => {
        const roles: string[] = user?.roles ?? [];
        if (roles.includes('ADMIN')) {
          router.replace('/admin/asignaciones');
        } else if (roles.includes('SUPERVISOR')) {
          router.replace('/admin/supervision');
        }
      })
      .catch(() => router.replace('/'));
  }, [router]);

  // The document detail page will handle its own header
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
