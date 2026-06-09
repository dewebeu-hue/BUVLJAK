import { ConvexError, v } from "convex/values";
import { action, query } from "./_generated/server";
import { api } from "./_generated/api";
import { listingTypeValidator, priceTypeValidator } from "./validators";
import { getPublicListingUrl } from "../lib/public-urls";

type Tone = "simple" | "friendly" | "short";

type PublicListingForPost = {
  id?: string;
  type: "sell" | "give" | "swap" | "want";
  title: string;
  city: string;
  category: string;
  price?: number;
  priceType: "fixed" | "negotiable" | "free" | "swap" | "wanted";
  description: string;
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

const toneValidator = v.union(v.literal("simple"), v.literal("friendly"), v.literal("short"));

const listingDraftValidator = v.object({
  type: listingTypeValidator,
  title: v.string(),
  city: v.string(),
  category: v.string(),
  price: v.optional(v.number()),
  priceType: priceTypeValidator,
  description: v.string()
});

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clippedDescription(description: string, tone: Tone) {
  const cleaned = cleanLine(description);
  const maxLength = tone === "short" ? 150 : 320;

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

function formatPriceForPost(listing: PublicListingForPost) {
  if (listing.priceType === "free") {
    return "Poklanjam";
  }

  if (listing.priceType === "swap") {
    return "Zamjena";
  }

  if (listing.priceType === "wanted") {
    return listing.price === undefined ? "Tražim" : `Tražim do ${Math.round(listing.price)} EUR`;
  }

  if (listing.priceType === "negotiable") {
    return listing.price === undefined ? "Može dogovor" : `${Math.round(listing.price)} EUR, može dogovor`;
  }

  return listing.price === undefined ? "Po dogovoru" : `${Math.round(listing.price)} EUR`;
}

function buildListingUrl(id?: string) {
  if (!id) {
    return undefined;
  }

  return getPublicListingUrl(id);
}

function ensureDetailsLink(text: string, id?: string) {
  const listingUrl = buildListingUrl(id);

  if (!listingUrl || text.includes(listingUrl)) {
    return text.trim();
  }

  return `${text.trim()}\n\nViše detalja: ${listingUrl}`;
}

function generateFallbackText(listing: PublicListingForPost, tone: Tone) {
  const title = cleanLine(listing.title);
  const city = cleanLine(listing.city);
  const category = cleanLine(listing.category);
  const description = clippedDescription(listing.description, tone);
  const priceText = formatPriceForPost(listing);
  const listingUrl = buildListingUrl(listing.id);
  const friendlyCloser =
    tone === "friendly" ? "Ako ti odgovara, javi se preko oglasa na Buvljaku." : "Javi se preko oglasa na Buvljaku.";

  const templates: Record<PublicListingForPost["type"], string[]> = {
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

async function generateWithOpenAI(listing: PublicListingForPost, tone: Tone) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  const payload = {
    title: listing.title,
    type: listing.type,
    city: listing.city,
    category: listing.category,
    price: listing.price,
    priceType: listing.priceType,
    description: clippedDescription(listing.description, "friendly"),
    tone
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        max_output_tokens: 320,
        input: [
          {
            role: "system",
            content:
              "Pišeš kratke hrvatske objave za lokalne Facebook i WhatsApp grupe. Koristi samo javna polja oglasa. Ne izmišljaj stanje, cijenu, kontakt, telefon, email, profil ili garanciju. Ne dodaj hashtagove. Ton je prijateljski, jasan i lokalni."
          },
          {
            role: "user",
            content: JSON.stringify(payload)
          }
        ]
      })
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as ResponsesApiResponse;
    const text = extractOutputText(data);

    return text ? text.slice(0, 1400).trim() : undefined;
  } catch {
    return undefined;
  }
}

export const getListingForFacebookPost = query({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      return null;
    }

    return {
      id: args.id,
      type: listing.type,
      title: listing.title,
      city: listing.city,
      category: listing.category,
      ...(listing.price !== undefined ? { price: listing.price } : {}),
      priceType: listing.priceType,
      description: listing.description
    };
  }
});

export const generateFacebookPostText = action({
  args: {
    listingId: v.optional(v.id("listings")),
    draft: v.optional(listingDraftValidator),
    tone: v.optional(toneValidator)
  },
  handler: async (ctx, args) => {
    const tone = args.tone ?? "friendly";
    const listing = args.listingId
      ? await ctx.runQuery(api.facebookPosts.getListingForFacebookPost, { id: args.listingId })
      : args.draft;

    if (!listing) {
      throw new ConvexError("Listing or draft is required.");
    }

    const generatedText = await generateWithOpenAI(listing, tone);

    if (generatedText) {
      return {
        generatedText: ensureDetailsLink(generatedText, listing.id),
        usedAi: true
      };
    }

    return {
      generatedText: ensureDetailsLink(generateFallbackText(listing, tone), listing.id),
      usedAi: false
    };
  }
});
