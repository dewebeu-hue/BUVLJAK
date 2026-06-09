import { v } from "convex/values";
import { action } from "./_generated/server";

type ListingType = "sell" | "give" | "swap" | "want";
type PriceType = "fixed" | "negotiable" | "free" | "swap" | "wanted";

type ParsedImportedListing = {
  type: ListingType;
  title: string;
  description: string;
  city: string;
  category: string;
  price?: number;
  priceType: PriceType;
  allowOffers: boolean;
  confidence?: number;
  warnings?: string[];
  usedAi?: boolean;
};

type ResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

const DEFAULT_CITY = "Nova Gradiška";
const DEFAULT_CATEGORY = "Ostalo";

const categories = [
  "Namještaj",
  "Djeca",
  "Dom",
  "Vrt i alat",
  "Kućanski aparati",
  "Ostalo"
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanDescription(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function maskContactInfo(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email skriven]")
    .replace(/(?:\+?\d[\s().-]?){7,}\d/g, "[telefon skriven]")
    .replace(/\b(?:whatsapp|viber|mob|mobitel|telefon|tel)\b\s*:?\s*\[telefon skriven\]/gi, "[kontakt skriven]");
}

function extractPrice(value: string) {
  const match = value.match(/(\d+(?:[,.]\d{1,2})?)\s*(?:€|eur|eura|euro|e)\b/i);

  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferType(normalizedText: string): ListingType {
  if (/\b(poklanjam|poklon|besplatno)\b/.test(normalizedText)) {
    return "give";
  }

  if (/\b(mijenjam|menjam|zamjena|zamjenio|zamijenio)\b/.test(normalizedText)) {
    return "swap";
  }

  if (/\b(trazim|kupujem|potrazujem)\b/.test(normalizedText)) {
    return "want";
  }

  return "sell";
}

function inferCity(normalizedText: string) {
  const knownCities: Array<[string, string]> = [
    ["nova gradiska", "Nova Gradiška"],
    ["cernik", "Cernik"],
    ["resetari", "Rešetari"],
    ["okucani", "Okučani"],
    ["staro petrovo selo", "Staro Petrovo Selo"],
    ["davor", "Davor"],
    ["zagreb", "Zagreb"],
    ["slavonski brod", "Slavonski Brod"]
  ];

  return knownCities.find(([needle]) => normalizedText.includes(needle))?.[1] ?? DEFAULT_CITY;
}

function inferCategory(normalizedText: string) {
  if (/\b(bicikl|kolica|igrack|djec|djeca|beba|odjeca|obuca)\b/.test(normalizedText)) {
    return "Djeca";
  }

  if (/\b(kauc|kauč|stol|stolic|ormar|polic|regal|krevet|namjestaj|namještaj)\b/.test(normalizedText)) {
    return "Namještaj";
  }

  if (/\b(perilica|frizider|frižider|pecnica|pećnica|mikroval|aparat)\b/.test(normalizedText)) {
    return "Kućanski aparati";
  }

  if (/\b(kosilica|alat|busilica|bušilica|vrt|lopata|pile|pila)\b/.test(normalizedText)) {
    return "Vrt i alat";
  }

  if (/\b(pec|peć|drva|radijator|rasvjeta|tepih|posude)\b/.test(normalizedText)) {
    return "Dom";
  }

  return DEFAULT_CATEGORY;
}

function inferPriceType(type: ListingType, price: number | undefined, normalizedText: string): PriceType {
  if (type === "give") {
    return "free";
  }

  if (type === "swap") {
    return "swap";
  }

  if (type === "want") {
    return "wanted";
  }

  if (/\b(dogovor|po dog|moze dogovor|može dogovor|inbox)\b/.test(normalizedText)) {
    return "negotiable";
  }

  return price === undefined ? "negotiable" : "fixed";
}

function allowOffersFor(type: ListingType, priceType: PriceType) {
  if (type === "give" || type === "want") {
    return false;
  }

  if (type === "swap") {
    return true;
  }

  return priceType === "fixed" || priceType === "negotiable";
}

function stripLeadWords(value: string) {
  return value
    .replace(/^(prodajem|prodaja|poklanjam|mijenjam|menjam|tražim|trazim|kupujem)\s*[:\-]?\s*/i, "")
    .replace(/\b(?:cijena|lokacija)\s*[:\-]?\s*/gi, "")
    .trim();
}

function buildTitle(rawText: string) {
  const firstLine = rawText
    .split(/\n|\.|,/)
    .map((part) => cleanText(stripLeadWords(part)))
    .find((part) => part.length >= 3);

  if (!firstLine) {
    return "Oglas iz Facebook objave";
  }

  return firstLine.length > 72 ? `${firstLine.slice(0, 69).trim()}...` : firstLine;
}

function extractOutputText(data: ResponsesApiResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const contentText = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n")
    .trim();

  return contentText || undefined;
}

function tryParseJsonObject(value: string) {
  const trimmed = value.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    return undefined;
  }

  try {
    return JSON.parse(jsonText) as Partial<ParsedImportedListing>;
  } catch {
    return undefined;
  }
}

function validateParsedListing(value: Partial<ParsedImportedListing>, fallback: ParsedImportedListing): ParsedImportedListing {
  const type = value.type && ["sell", "give", "swap", "want"].includes(value.type) ? value.type : fallback.type;
  const priceType =
    value.priceType && ["fixed", "negotiable", "free", "swap", "wanted"].includes(value.priceType)
      ? value.priceType
      : fallback.priceType;
  const price = typeof value.price === "number" && Number.isFinite(value.price) && value.price >= 0
    ? value.price
    : fallback.price;
  const category = value.category && categories.includes(value.category) ? value.category : fallback.category;
  const warnings = [...(fallback.warnings ?? []), ...(Array.isArray(value.warnings) ? value.warnings.filter(Boolean).map(String) : [])];

  return {
    type,
    title: cleanText(value.title ?? fallback.title).slice(0, 90) || fallback.title,
    description: cleanDescription(value.description ?? fallback.description).slice(0, 2000) || fallback.description,
    city: cleanText(value.city ?? fallback.city) || fallback.city,
    category,
    ...(price !== undefined ? { price } : {}),
    priceType,
    allowOffers: typeof value.allowOffers === "boolean" ? value.allowOffers : allowOffersFor(type, priceType),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? Math.min(Math.max(value.confidence, 0), 1)
        : fallback.confidence,
    warnings: Array.from(new Set(warnings)).slice(0, 5),
    usedAi: true
  };
}

function parseWithHeuristics(rawText: string, sourceFacebookUrl?: string): ParsedImportedListing {
  const cleaned = cleanDescription(maskContactInfo(rawText));
  const normalizedText = normalizeText(rawText);
  const type = inferType(normalizedText);
  const price = extractPrice(rawText);
  const city = inferCity(normalizedText);
  const category = inferCategory(normalizedText);
  const priceType = inferPriceType(type, price, normalizedText);
  const warnings: string[] = [];

  if (city === DEFAULT_CITY && !normalizedText.includes("nova gradiska")) {
    warnings.push("Grad nije jasno prepoznat, postavljena je Nova Gradiška.");
  }

  if (category === DEFAULT_CATEGORY) {
    warnings.push("Kategorija nije sigurno prepoznata, provjeri je prije objave.");
  }

  if (type === "sell" && price === undefined) {
    warnings.push("Cijena nije jasno prepoznata.");
  }

  if (sourceFacebookUrl) {
    warnings.push("Facebook link je spremljen kao izvor; sadržaj privatnih grupa ne čitamo automatski.");
  }

  return {
    type,
    title: buildTitle(cleaned),
    description: cleaned.slice(0, 2000),
    city,
    category,
    ...(price !== undefined ? { price } : {}),
    priceType,
    allowOffers: allowOffersFor(type, priceType),
    confidence: warnings.length ? 0.68 : 0.82,
    warnings,
    usedAi: false
  };
}

async function parseWithOpenAI(rawText: string, sourceFacebookUrl: string | undefined, fallback: ParsedImportedListing) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  const maskedText = maskContactInfo(rawText).slice(0, 3000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_output_tokens: 550,
        input: [
          {
            role: "system",
            content:
              "Strukturiras tekst hrvatskog lokalnog oglasa u strogi JSON. Ne izmisljaj stanje predmeta, cijenu, lokaciju, kontakt ili kategoriju. Ako nisi siguran, dodaj warning. Vrati samo JSON objekt s poljima type, title, description, city, category, price, priceType, allowOffers, confidence, warnings."
          },
          {
            role: "user",
            content: JSON.stringify({
              rawText: maskedText,
              sourceFacebookUrl: sourceFacebookUrl ? "[facebook link spremljen kao izvor]" : undefined,
              allowedTypes: ["sell", "give", "swap", "want"],
              allowedPriceTypes: ["fixed", "negotiable", "free", "swap", "wanted"],
              allowedCategories: categories,
              defaultCity: DEFAULT_CITY,
              defaultCategory: DEFAULT_CATEGORY
            })
          }
        ]
      })
    });

    if (!response.ok) {
      return undefined;
    }

    const text = extractOutputText((await response.json()) as ResponsesApiResponse);
    const parsed = text ? tryParseJsonObject(text) : undefined;

    return parsed ? validateParsedListing(parsed, fallback) : undefined;
  } catch {
    return undefined;
  }
}

export const parseImportedListingText = action({
  args: {
    rawText: v.string(),
    sourceFacebookUrl: v.optional(v.string())
  },
  handler: async (_ctx, args) => {
    const rawText = args.rawText.trim();
    const sourceFacebookUrl = args.sourceFacebookUrl?.trim();

    if (!rawText) {
      return {
        ...parseWithHeuristics("Oglas iz Facebook objave", sourceFacebookUrl),
        title: "Oglas iz Facebook objave",
        description: "",
        confidence: 0.2,
        warnings: ["Ne možemo automatski pročitati ovu Facebook objavu. Zalijepi tekst oglasa ispod."],
        usedAi: false
      };
    }

    const fallback = parseWithHeuristics(rawText, sourceFacebookUrl);
    const aiResult = await parseWithOpenAI(rawText, sourceFacebookUrl, fallback);

    return aiResult ?? fallback;
  }
});
