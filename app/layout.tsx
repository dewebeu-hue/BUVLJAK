import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
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
        <ClerkProvider>
          <ConvexClientProvider>
            <SiteHeader />
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
