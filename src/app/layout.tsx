import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppFooter } from "@/components/layout/AppFooter";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Génesis Sign",
  description:
    "Plataforma zero-trust para el envío, firma colaborativa y auditoría de documentos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Providers>
          <>
            <main className="flex-grow">{children}</main>
            <AppFooter />
            <Toaster />
          </>
        </Providers>
      </body>
    </html>
  );
}
