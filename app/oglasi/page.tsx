import type { Metadata } from "next";
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
  return <ListingsExplorer />;
}
