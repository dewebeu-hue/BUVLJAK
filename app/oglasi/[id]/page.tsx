import type { Metadata } from "next";
import { ListingDetailView } from "@/components/listing-detail-view";
import {
  fallbackOgDescription,
  getListingMetadataTitle,
  getOgDescription,
  getPublicListingPreview
} from "@/lib/public-listing-preview";
import { getListingOgImageUrl, getPublicListingUrl } from "@/lib/public-urls";

type ListingDetailParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ListingDetailParams): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublicListingPreview(id);
  const listingUrl = getPublicListingUrl(id);
  const imageUrl = getListingOgImageUrl(id);

  if (!listing || listing.status === "removed") {
    const title = "Oglas nije pronađen | Buvljak";
    const description = "Ovaj oglas nije dostupan ili je uklonjen.";

    return {
      title,
      description,
      alternates: {
        canonical: listingUrl
      },
      openGraph: {
        title,
        description,
        url: listingUrl,
        siteName: "Buvljak",
        type: "website",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }]
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl]
      }
    };
  }

  const title = getListingMetadataTitle(listing);
  const description = getOgDescription(listing) || fallbackOgDescription;

  return {
    title,
    description,
    alternates: {
      canonical: listingUrl
    },
    openGraph: {
      title,
      description,
      url: listingUrl,
      siteName: "Buvljak",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export default async function ListingDetailPage({
  params
}: ListingDetailParams) {
  const { id } = await params;

  return <ListingDetailView listingId={id} />;
}
