"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({
  href = "/admin/mis-documentos",
  className,
  imageClassName,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 px-3 py-4", className)}
      aria-label="Ir a Mis Documentos"
    >
      <Image
        src="/genesissign.png"
        alt="Génesis Sign Logotipo"
        width={144}
        height={32}
        priority
        className={cn(
          "h-8 w-auto max-w-full rounded-md select-none md:h-9",
          imageClassName
        )}
      />
    </Link>
  );
}
