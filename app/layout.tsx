import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/hooks/useLanguage";
import "./globals.css";

export const metadata: Metadata = {
  title: "CapyFilms",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
