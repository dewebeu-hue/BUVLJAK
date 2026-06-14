import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsExplorer } from "@/components/listings-explorer";
import { getAppBaseUrl, getDefaultOgImageUrl } from "@/lib/public-urls";

const listingsUrl = `${getAppBaseUrl()}/oglasi`;
const defaultOgImageUrl = getDefaultOgImageUrl();

export const metadata: Metadata = {
  title: "Oglasi | Buvljak",
  description: "Pregled lokalnih oglasa za prodaju, poklanjanje, razmjenu i potragu u blizini.",
  alternates: {
    canonical: listingsUrl
  },
  openGraph: {
    title: "Oglasi | Buvljak",
    description: "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini.",
    url: listingsUrl,
    siteName: "Buvljak",
    type: "website",
    images: [{ url: defaultOgImageUrl, width: 1200, height: 630, alt: "Buvljak oglasi" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Oglasi | Buvljak",
    description: "Prodajem, poklanjam, mijenjam i tražim u svojoj blizini.",
    images: [defaultOgImageUrl]
  }
};

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsPageFallback />}>
      <ListingsExplorer />
    </Suspense>
  );
}

function ListingsPageFallback() {
  return (
    <main className="bg-[#fbfcf7] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="h-44 animate-pulse rounded-xl border border-ink/10 bg-white shadow-sm" />
      </div>
    </main>
  );
}
