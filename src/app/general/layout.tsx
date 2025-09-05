
"use client";

import { GeneralHeader } from "@/components/general-header";
import { usePathname } from "next/navigation";

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The document detail page will handle its own header
  const isDocumentDetailPage = pathname.startsWith('/documento/');

  if (isDocumentDetailPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen">
      <GeneralHeader />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
