import type { Doc } from "@/convex/_generated/dataModel";

export type ListingType = "sell" | "give" | "swap" | "want";

export type ListingStatus = "active" | "paused" | "resolved" | "removed";

export type ContactMethod = "whatsapp" | "email" | "facebook" | "none";

export type PriceType = "fixed" | "negotiable" | "free" | "swap" | "wanted";

export type ListingImportSource = "manual" | "facebook_text" | "facebook_url";

export type FeaturedLabel = "Istaknuto" | "Hitno" | "Top oglas";

export type ListingTypeMeta = {
  label: string;
  description: string;
  primaryCtaLabel: string;
  badgeClassName: string;
};

export type Listing = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price: number | null;
  priceType: PriceType;
  status: ListingStatus;
  contactMethod: ContactMethod;
  allowOffers: boolean;
  images: string[];
  imageUrls: string[];
  viewCount: number;
  saveCount: number;
  shareCount: number;
  contactClickCount: number;
  isFeatured?: boolean;
  featuredUntil?: number;
  featuredLabel?: FeaturedLabel;
  featuredCreatedAt?: number;
  importSource?: ListingImportSource;
  sourceFacebookUrl?: string;
  importedRawText?: string;
  importParsedAt?: number;
  createdAt: string;
  updatedAt?: string;
  ownerDisplayName?: string;
  isOwner?: boolean;
  isPersisted?: boolean;
};

type ConvexListingWithPresentation = Doc<"listings"> & {
  imageUrls?: string[];
  ownerDisplayName?: string;
  isOwner?: boolean;
};

export const listingTypeLabels: Record<ListingType, string> = {
  sell: "Prodajem",
  give: "Poklanjam",
  swap: "Mijenjam",
  want: "Tražim"
};

export const listingTypeDescriptions: Record<ListingType, string> = {
  sell: "Prodaj stvar nekome u blizini i brzo dogovori preuzimanje.",
  give: "Pokloni stvar koja ti više ne treba, bez kompliciranja.",
  swap: "Ponudi zamjenu i dogovori što objema stranama odgovara.",
  want: "Objavi što tražiš i pusti lokalnu mrežu da pomogne."
};

export const listingTypePrimaryCtaLabels: Record<ListingType, string> = {
  sell: "Pošalji ponudu",
  give: "Javi se za preuzimanje",
  swap: "Predloži zamjenu",
  want: "Imam nešto za ponuditi"
};

export const listingTypeBadgeClassNames: Record<ListingType, string> = {
  sell: "border-moss/20 bg-moss/10 text-mossDark",
  give: "border-honey/30 bg-honey/16 text-[#72520d]",
  swap: "border-plum/20 bg-plum/10 text-plum",
  want: "border-clay/20 bg-clay/10 text-clay"
};

export const listingTypeMeta: Record<ListingType, ListingTypeMeta> = {
  sell: {
    label: listingTypeLabels.sell,
    description: listingTypeDescriptions.sell,
    primaryCtaLabel: listingTypePrimaryCtaLabels.sell,
    badgeClassName: listingTypeBadgeClassNames.sell
  },
  give: {
    label: listingTypeLabels.give,
    description: listingTypeDescriptions.give,
    primaryCtaLabel: listingTypePrimaryCtaLabels.give,
    badgeClassName: listingTypeBadgeClassNames.give
  },
  swap: {
    label: listingTypeLabels.swap,
    description: listingTypeDescriptions.swap,
    primaryCtaLabel: listingTypePrimaryCtaLabels.swap,
    badgeClassName: listingTypeBadgeClassNames.swap
  },
  want: {
    label: listingTypeLabels.want,
    description: listingTypeDescriptions.want,
    primaryCtaLabel: listingTypePrimaryCtaLabels.want,
    badgeClassName: listingTypeBadgeClassNames.want
  }
};

export const listingStatusLabels: Record<ListingStatus, string> = {
  active: "Aktivno",
  paused: "Pauzirano",
  resolved: "Riješeno",
  removed: "Uklonjeno"
};

export const listingStatusBadgeClassNames: Record<ListingStatus, string> = {
  active: "border-moss/16 bg-moss/8 text-mossDark",
  paused: "border-honey/24 bg-honey/18 text-[#72520d]",
  resolved: "border-skywash bg-skywash/70 text-mossDark",
  removed: "border-clay/20 bg-clay/8 text-clay"
};

export const contactMethodLabels: Record<ContactMethod, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  facebook: "Facebook link",
  none: "Bez kontakta"
};

export const listingTypeFilterOptions: Array<{ value: ListingType | "all"; label: string }> = [
  { value: "all", label: "Sve" },
  { value: "sell", label: listingTypeLabels.sell },
  { value: "give", label: listingTypeLabels.give },
  { value: "swap", label: listingTypeLabels.swap },
  { value: "want", label: listingTypeLabels.want }
];

export const listingStatusFilterOptions: Array<{ value: ListingStatus; label: string }> = [
  { value: "active", label: "Aktivni" },
  { value: "paused", label: "Pauzirani" },
  { value: "resolved", label: "Riješeni" },
  { value: "removed", label: "Uklonjeni" }
];

export function inferPriceType(type: ListingType): PriceType {
  if (type === "give") {
    return "free";
  }

  if (type === "swap") {
    return "swap";
  }

  if (type === "want") {
    return "wanted";
  }

  return "fixed";
}

export function formatPrice(price: number | null, type?: ListingType) {
  if (type === "give") {
    return "Poklanjam";
  }

  if (type === "swap") {
    return "Mijenjam";
  }

  if (type === "want" && price === null) {
    return "Tražim";
  }

  if (price === null) {
    return "Cijena po dogovoru";
  }

  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(price);
}

export function formatListingPrice(listing: Pick<Listing, "price" | "priceType" | "type">) {
  if (listing.priceType === "free") {
    return "Poklanjam";
  }

  if (listing.priceType === "swap") {
    return "Mijenjam";
  }

  if (listing.priceType === "wanted") {
    return listing.price === null ? "Tražim" : `Tražim do ${formatPrice(listing.price)}`;
  }

  if (listing.priceType === "negotiable") {
    return listing.price === null
      ? "Cijena za dogovor"
      : `${formatPrice(listing.price)} · Cijena za dogovor`;
  }

  return formatPrice(listing.price, listing.type);
}

export function formatListingStatus(status: ListingStatus) {
  return listingStatusLabels[status];
}

export function actionLabelForListing(listing: Pick<Listing, "allowOffers" | "type">) {
  if (listing.type === "sell" && !listing.allowOffers) {
    return "Pitaj za dogovor";
  }

  return listingTypePrimaryCtaLabels[listing.type];
}

export function contactMethodHint(method: ContactMethod) {
  if (method === "none") {
    return "Oglašivač nije ostavio javni kontakt.";
  }

  return `${contactMethodLabels[method]} je spremljen, ali privatni podaci nisu javno prikazani.`;
}

export function fromConvexListing(listing: ConvexListingWithPresentation): Listing {
  return {
    id: listing._id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    price: listing.price ?? null,
    priceType: listing.priceType,
    status: listing.status,
    contactMethod: listing.contactMethod,
    allowOffers: listing.allowOffers,
    images: listing.images,
    imageUrls: listing.imageUrls ?? [],
    viewCount: listing.viewCount,
    contactClickCount: listing.contactClickCount,
    importSource: listing.importSource,
    sourceFacebookUrl: listing.sourceFacebookUrl,
    importedRawText: listing.importedRawText,
    importParsedAt: listing.importParsedAt,
    isFeatured: listing.isFeatured,
    featuredUntil: listing.featuredUntil,
    featuredLabel: listing.featuredLabel,
    featuredCreatedAt: listing.featuredCreatedAt,
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    createdAt: new Date(listing.createdAt).toISOString(),
    updatedAt: new Date(listing.updatedAt).toISOString(),
    ownerDisplayName: listing.ownerDisplayName,
    isOwner: listing.isOwner,
    isPersisted: true
  };
}
