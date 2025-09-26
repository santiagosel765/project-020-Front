"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/brand/logo-mark.svg"
        alt="Génesis Sign"
        width={28}
        height={28}
        priority
        className="md:hidden"
      />
      <Image
        src="/brand/logo-full.svg"
        alt="Génesis Sign"
        width={160}
        height={40}
        priority
        className="hidden md:block"
      />
    </div>
  );
}
