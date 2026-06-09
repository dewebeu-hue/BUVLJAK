export type ListingType = "sell" | "give" | "swap" | "want";

export type ListingStatus = "active" | "paused" | "resolved" | "removed";

export type ContactMethod = "whatsapp" | "email" | "facebook" | "none";

export type Listing = {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price: number | null;
  status: ListingStatus;
  contactMethod: ContactMethod;
  createdAt: string;
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

export const demoListings: Listing[] = [
  {
    id: "demo-bike",
    type: "sell",
    title: "Dječji bicikl 20”",
    description: "Očuvan bicikl za školarca, normalni tragovi korištenja i spreman za vožnju.",
    city: "Nova Gradiška",
    category: "Djeca",
    price: 65,
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

export const adminListings: Listing[] = [
  ...demoListings.slice(0, 4),
  { ...demoListings[4], status: "paused" },
  { ...demoListings[5], status: "resolved" },
  { ...demoListings[6], status: "removed" },
  { ...demoListings[7], status: "active" }
];

export function formatPrice(price: number | null, type?: ListingType) {
  if (type === "give") {
    return "Poklanjam";
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
