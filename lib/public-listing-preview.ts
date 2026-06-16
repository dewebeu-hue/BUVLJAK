import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  formatListingPrice,
  type ListingStatus,
  type ListingType,
  type PriceType
} from "@/lib/listings";

export type PublicListingPreview = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price?: number;
  priceType: PriceType;
  status: ListingStatus;
  allowOffers: boolean;
  images: string[];
  imageUrls: string[];
  viewCount: number;
  shareCount: number;
  saveCount: number;
  createdAt: number;
  updatedAt: number;
};

export const fallbackOgDescription =
  "Lokalni oglas na Buvljaku - prodajem, poklanjam, mijenjam i tražim u svojoj blizini.";

export async function getPublicListingPreview(listingId: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return null;
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const listing = await client.query(api.listings.getPublicListingById, {
      id: listingId as Id<"listings">
    });

    return listing as PublicListingPreview | null;
  } catch {
    return null;
  }
}

export function getSharePriceText(
  listing: Pick<PublicListingPreview, "price" | "priceType" | "type">
) {
  return formatListingPrice({
    type: listing.type,
    price: listing.price ?? null,
    priceType: listing.priceType
  });
}

export function scrubPrivateContactText(value?: string) {
  return (value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email skriven]")
    .replace(/(?:\+?\d[\s().-]?){7,}\d/g, "[telefon skriven]")
    .replace(/https?:\/\/(?:www\.)?facebook\.com\/\S+/gi, "[Facebook link skriven]")
    .replace(/\s+/g, " ")
    .trim();
}

export function getOgDescription(listing?: Pick<PublicListingPreview, "description"> | null) {
  const cleaned = scrubPrivateContactText(listing?.description);

  if (!cleaned) {
    return fallbackOgDescription;
  }

  return cleaned.length > 178 ? `${cleaned.slice(0, 175).trim()}...` : cleaned;
}

export function getListingMetadataTitle(listing: PublicListingPreview) {
  return `${listing.title} · ${getSharePriceText(listing)} · ${listing.city} | Buvljak`;
}
