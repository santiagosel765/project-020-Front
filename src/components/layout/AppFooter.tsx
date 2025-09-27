"use client";

import { usePathname } from "next/navigation";

export function AppFooter() {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith("/documento/");

  if (hideFooter) {
    return null;
  }

  return (
    <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
      <div className="copyright">
        ©2025 Génesis Sign • by MAC Génesis • <span id="blockchain-status">⛓️</span>
      </div>
    </footer>
  );
}

export default AppFooter;
