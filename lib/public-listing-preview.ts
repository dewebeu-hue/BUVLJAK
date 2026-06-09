import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  demoListings,
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

function demoListingToPublic(listingId: string): PublicListingPreview | null {
  const listing = demoListings.find((item) => item.id === listingId);

  if (!listing) {
    return null;
  }

  return {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    ...(listing.price !== null ? { price: listing.price } : {}),
    priceType: listing.priceType,
    status: listing.status,
    allowOffers: listing.allowOffers,
    images: listing.images,
    imageUrls: listing.imageUrls,
    viewCount: listing.viewCount,
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    createdAt: new Date(listing.createdAt).getTime(),
    updatedAt: listing.updatedAt ? new Date(listing.updatedAt).getTime() : new Date(listing.createdAt).getTime()
  };
}

export async function getPublicListingPreview(listingId: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return demoListingToPublic(listingId);
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const listing = await client.query(api.listings.getPublicListingById, {
      id: listingId as Id<"listings">
    });

    return listing as PublicListingPreview | null;
  } catch {
    return demoListingToPublic(listingId);
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
