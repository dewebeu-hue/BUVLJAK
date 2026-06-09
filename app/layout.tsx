import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { SiteHeader } from "@/components/site-header";
import { getAppBaseUrl, getDefaultOgImageUrl } from "@/lib/public-urls";

const appBaseUrl = getAppBaseUrl();
const defaultOgImageUrl = getDefaultOgImageUrl(appBaseUrl);

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: "Buvljak",
  description: "Lokalni feed za prodaju, poklanjanje, razmjenu i potragu stvari u blizini.",
  openGraph: {
    title: "Buvljak",
    description: "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini.",
    url: appBaseUrl,
    siteName: "Buvljak",
    type: "website",
    images: [{ url: defaultOgImageUrl, width: 1200, height: 630, alt: "Buvljak" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Buvljak",
    description: "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini.",
    images: [defaultOgImageUrl]
  }
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
