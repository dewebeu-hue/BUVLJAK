import {
  formatListingPrice,
  type ListingType,
  type PriceType
} from "@/lib/listings";
import { getPublicListingUrl } from "@/lib/public-urls";

export type FacebookPostTone = "simple" | "friendly" | "short";

export type FacebookPostListingInput = {
  id?: string;
  type: ListingType;
  title: string;
  city: string;
  category: string;
  price?: number | null;
  priceType: PriceType;
  description: string;
};

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clippedDescription(description: string, tone: FacebookPostTone) {
  const cleaned = cleanLine(description);
  const maxLength = tone === "short" ? 150 : 320;

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

export function buildListingUrl(listingId?: string, appUrl?: string) {
  if (!listingId) {
    return undefined;
  }

  return getPublicListingUrl(listingId, appUrl);
}

export function generateFallbackFacebookPostText(
  listing: FacebookPostListingInput,
  tone: FacebookPostTone = "friendly",
  appUrl?: string
) {
  const title = cleanLine(listing.title);
  const city = cleanLine(listing.city);
  const category = cleanLine(listing.category);
  const description = clippedDescription(listing.description, tone);
  const priceText = formatListingPrice({
    type: listing.type,
    price: listing.price ?? null,
    priceType: listing.priceType
  });
  const listingUrl = buildListingUrl(listing.id, appUrl);
  const friendlyCloser =
    tone === "friendly" ? "Ako ti odgovara, javi se preko oglasa na Buvljaku." : "Javi se preko oglasa na Buvljaku.";

  const templates: Record<ListingType, string[]> = {
    sell: [
      `Prodajem: ${title}`,
      `Lokacija: ${city}`,
      `Kategorija: ${category}`,
      `Cijena: ${priceText}`,
      "",
      description,
      "",
      friendlyCloser
    ],
    give: [
      `Poklanjam: ${title}`,
      `Lokacija: ${city}`,
      `Kategorija: ${category}`,
      "",
      description,
      "",
      "Preuzimanje po dogovoru preko oglasa na Buvljaku."
    ],
    swap: [
      `Mijenjam: ${title}`,
      `Lokacija: ${city}`,
      `Kategorija: ${category}`,
      "",
      description,
      "",
      "Otvoren/a sam za prijedloge zamjene preko oglasa na Buvljaku."
    ],
    want: [
      `Tražim: ${title}`,
      `Lokacija: ${city}`,
      `Kategorija: ${category}`,
      `Budžet: ${priceText}`,
      "",
      description,
      "",
      "Ako imaš nešto slično, javi se preko oglasa na Buvljaku."
    ]
  };

  const lines = tone === "short" ? templates[listing.type].filter((line) => line !== "") : templates[listing.type];

  if (listingUrl) {
    lines.push("", `Više detalja: ${listingUrl}`);
  }

  return lines.filter((line, index, all) => line || all[index - 1]).join("\n").trim();
}
