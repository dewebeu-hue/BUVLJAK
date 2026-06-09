import type { Doc } from "@/convex/_generated/dataModel";

export type ListingType = "sell" | "give" | "swap" | "want";

export type ListingStatus = "active" | "paused" | "resolved" | "removed";

export type ContactMethod = "whatsapp" | "email" | "facebook" | "none";

export type PriceType = "fixed" | "negotiable" | "free" | "swap" | "wanted";

export type ListingImportSource = "manual" | "facebook_text" | "facebook_url";

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

export const listingStatusLabels: Record<ListingStatus, string> = {
  active: "Aktivno",
  paused: "Pauzirano",
  resolved: "Riješeno",
  removed: "Uklonjeno"
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

const baseDemoListings: Array<
  Omit<
    Listing,
    | "allowOffers"
    | "contactClickCount"
    | "imageUrls"
    | "images"
    | "isPersisted"
    | "priceType"
    | "saveCount"
    | "shareCount"
    | "viewCount"
  > &
    Partial<Pick<Listing, "allowOffers" | "priceType">>
> = [
  {
    id: "demo-bike",
    type: "sell",
    title: "Dječji bicikl 20”",
    description: "Očuvan bicikl za školarca, normalni tragovi korištenja i spreman za vožnju.",
    city: "Nova Gradiška",
    category: "Djeca",
    price: 65,
    priceType: "negotiable",
    status: "active",
    contactMethod: "whatsapp",
    createdAt: "2026-06-08T09:15:00.000Z"
  },
  {
    id: "demo-couch",
    type: "give",
    title: "Poklanjam kauč",
    description: "Trosjed za preuzimanje ovaj tjedan. Treba organizirati vlastiti prijevoz.",
    city: "Cernik",
    category: "Namještaj",
    price: null,
    status: "active",
    contactMethod: "facebook",
    createdAt: "2026-06-08T08:20:00.000Z"
  },
  {
    id: "demo-washer",
    type: "want",
    title: "Tražim perilicu do 100 €",
    description: "Treba mi ispravna perilica za stan, može stariji model ako radi uredno.",
    city: "Rešetari",
    category: "Kućanski aparati",
    price: 100,
    status: "active",
    contactMethod: "email",
    createdAt: "2026-06-07T17:40:00.000Z"
  },
  {
    id: "demo-chairs",
    type: "swap",
    title: "Mijenjam stolice za policu",
    description: "Četiri kuhinjske stolice mijenjam za jednostavnu policu ili manji regal.",
    city: "Nova Gradiška",
    category: "Namještaj",
    price: null,
    status: "active",
    contactMethod: "whatsapp",
    createdAt: "2026-06-07T14:10:00.000Z"
  },
  {
    id: "demo-stove",
    type: "sell",
    title: "Prodajem peć na drva",
    description: "Peć je korištena dvije sezone, dobra za radionicu, garažu ili manju kuću.",
    city: "Okučani",
    category: "Dom",
    price: 180,
    status: "active",
    contactMethod: "facebook",
    createdAt: "2026-06-06T12:25:00.000Z"
  },
  {
    id: "demo-clothes",
    type: "give",
    title: "Poklanjam dječju odjeću",
    description: "Vreća odjeće za djevojčicu, veličine uglavnom 98-110, čisto i složeno.",
    city: "Nova Gradiška",
    category: "Djeca",
    price: null,
    status: "active",
    contactMethod: "whatsapp",
    createdAt: "2026-06-05T18:00:00.000Z"
  },
  {
    id: "demo-wardrobe",
    type: "want",
    title: "Tražim ormar",
    description: "Tražim uži ormar za hodnik. Može rabljeno, bitno da su vrata ispravna.",
    city: "Staro Petrovo Selo",
    category: "Namještaj",
    price: null,
    status: "active",
    contactMethod: "email",
    createdAt: "2026-06-05T10:35:00.000Z"
  },
  {
    id: "demo-tools",
    type: "swap",
    title: "Mijenjam alat za kosilicu",
    description: "Imam višak ručnog alata i tražim ispravnu električnu kosilicu za manje dvorište.",
    city: "Davor",
    category: "Vrt i alat",
    price: null,
    status: "active",
    contactMethod: "facebook",
    createdAt: "2026-06-04T16:50:00.000Z"
  }
];

export const demoListings: Listing[] = baseDemoListings.map((listing, index) => ({
  ...listing,
  priceType: listing.priceType ?? inferPriceType(listing.type),
  allowOffers: listing.allowOffers ?? listing.type !== "give",
  images: [],
  imageUrls: [],
  viewCount: 8 + index * 3,
  contactClickCount: index,
  shareCount: Math.max(0, index - 1),
  saveCount: 2 + index,
  isPersisted: false
}));

export const adminListings: Listing[] = [
  ...demoListings.slice(0, 4),
  { ...demoListings[4], status: "paused" },
  { ...demoListings[5], status: "resolved" },
  { ...demoListings[6], status: "removed" },
  { ...demoListings[7], status: "active" }
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
    return "Zamjena";
  }

  if (type === "want" && price === null) {
    return "Tražim";
  }

  if (price === null) {
    return "Po dogovoru";
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
    return "Zamjena";
  }

  if (listing.priceType === "wanted") {
    return listing.price === null ? "Tražim" : `Tražim do ${formatPrice(listing.price)}`;
  }

  if (listing.priceType === "negotiable") {
    return listing.price === null ? "Može dogovor" : `${formatPrice(listing.price)} · Može dogovor`;
  }

  return formatPrice(listing.price, listing.type);
}

export function actionLabelForListing(listing: Pick<Listing, "allowOffers" | "type">) {
  if (listing.type === "give") {
    return "Javi se za preuzimanje";
  }

  if (listing.type === "swap") {
    return "Predloži zamjenu";
  }

  if (listing.type === "want") {
    return "Imam nešto za ponuditi";
  }

  return listing.allowOffers ? "Pošalji ponudu" : "Pitaj za dogovor";
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
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    createdAt: new Date(listing.createdAt).toISOString(),
    updatedAt: new Date(listing.updatedAt).toISOString(),
    ownerDisplayName: listing.ownerDisplayName,
    isOwner: listing.isOwner,
    isPersisted: true
  };
}
