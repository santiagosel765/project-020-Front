import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
            <footer className="py-4 px-6 text-center text-muted-foreground text-sm">
              <div className="copyright">
                ©2025 Génesis Sign • by MAC Génesis •{" "}
                <span id="blockchain-status">⛓️</span>
              </div>
            </footer>
            <Toaster />
          </>
        </Providers>
      </body>
    </html>
  );
}
