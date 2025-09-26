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
      aria-label="Ir a Mis Documentos"
      className={cn(
        // centra el contenido y ocupa el ancho del sidebar
        "flex w-full items-center justify-center px-4 py-5",
        className
      )}
    >
      <Image
        src="/genesissign.png"
        alt="Génesis Sign Logotipo"
        // un poco más grande que antes
        width={192}
        height={44}
        priority
        className={cn(
          // tamaño base (mayor) y responsive
          "h-11 w-auto max-w-full select-none md:h-12",
          imageClassName
        )}
      />
    </Link>
  );
}
