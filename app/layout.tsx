import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UserProfileSync } from "@/components/user-profile-sync";
import { getAppBaseUrl, getDefaultOgImageUrl } from "@/lib/public-urls";
import { hrHR } from "@clerk/localizations";

const appBaseUrl = getAppBaseUrl();
const defaultOgImageUrl = getDefaultOgImageUrl(appBaseUrl);
const siteTitle = "Buvljak — lokalni feed za prodaju, poklanjanje, razmjenu i potragu";
const siteDescription =
  "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini. Buvljak je lokalni alat za oglase i potrage, prvo za Novu Gradišku i okolicu.";

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: appBaseUrl,
    siteName: "Buvljak",
    type: "website",
    images: [{ url: defaultOgImageUrl, width: 1200, height: 630, alt: "Buvljak" }]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
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
        <ClerkProvider
  publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
  localization={hrHR}
>
                <ConvexClientProvider>
            <UserProfileSync />
            <SiteHeader />
            {children}
            <SiteFooter />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
