import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Buvljak",
  description: "Lokalni feed za prodaju, poklanjanje, razmjenu i potragu stvari u blizini."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="hr">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
