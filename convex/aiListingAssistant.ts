import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { listingTypeValidator } from "./validators";

type ListingType = "sell" | "give" | "swap" | "want";
type SuggestedCondition = "new" | "used" | "damaged" | "unknown";
type Confidence = "low" | "medium" | "high";

type AiListingDraftSuggestion = {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedCategory: string;
  suggestedCondition: SuggestedCondition;
  priceLow: number | null;
  priceHigh: number | null;
  recommendedPrice: number | null;
  priceConfidence: Confidence;
  priceRationale: string;
  shouldAllowOffers: boolean;
  facebookText: string;
  warnings: string[];
  confidence: Confidence;
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

type JsonRecord = Record<string, unknown>;

const DEFAULT_LOCAL_CONTEXT = "Nova Gradiška i okolica";
const DEFAULT_MODEL = "gpt-4o-mini";
const AI_DISABLED_MESSAGE = "AI prijedlog trenutno nije dostupan.";
const AI_LOGIN_MESSAGE = "Za AI prijedlog moraš biti prijavljen.";
const AI_INVALID_IMAGES_MESSAGE = "Dodaj 1 do 3 slike za AI prijedlog.";
const AI_IMAGE_URL_MESSAGE = "Slike trenutno nije moguće pripremiti. Oglas možeš nastaviti ručno.";
const AI_RESPONSE_MESSAGE = "AI prijedlog trenutno nije moguće pripremiti. Oglas možeš nastaviti ručno.";
const AI_TIMEOUT_MS = 30_000;

const conditionValues: SuggestedCondition[] = ["new", "used", "damaged", "unknown"];
const confidenceValues: Confidence[] = ["low", "medium", "high"];

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clipText(value: unknown, maxLength: number, fallback: string) {
  const text = typeof value === "string" ? cleanLine(value) : "";

  if (!text) {
    return fallback;
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

function clipMultilineText(value: unknown, maxLength: number, fallback: string) {
  const text =
    typeof value === "string"
      ? value
          .replace(/\r\n/g, "\n")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : "";

  if (!text) {
    return fallback;
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

function optionalClippedText(value: string | undefined, maxLength: number) {
  if (!value) {
    return undefined;
  }

  const cleaned = cleanLine(value);
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function isFeatureDisabled(value: string | undefined) {
  if (value === undefined) {
    return false;
  }

  return ["0", "false", "off", "no"].includes(value.trim().toLowerCase());
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
  const withoutFence = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const jsonText = withoutFence.startsWith("{") ? withoutFence : withoutFence.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(jsonText);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as JsonRecord) : undefined;
  } catch {
    return undefined;
  }
}

function normalizeCondition(value: unknown): SuggestedCondition {
  return typeof value === "string" && conditionValues.includes(value as SuggestedCondition)
    ? (value as SuggestedCondition)
    : "unknown";
}

function normalizeConfidence(value: unknown, fallback: Confidence = "low"): Confidence {
  return typeof value === "string" && confidenceValues.includes(value as Confidence) ? (value as Confidence) : fallback;
}

function normalizePrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value);
}

function uniqueWarnings(value: unknown) {
  const warnings = Array.isArray(value)
    ? value
        .map((warning) => (typeof warning === "string" ? cleanLine(warning) : ""))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return Array.from(new Set(warnings));
}

function normalizePrices(value: JsonRecord, listingType: ListingType | undefined) {
  if (listingType === "give") {
    return {
      priceLow: null,
      priceHigh: null,
      recommendedPrice: null
    };
  }

  let priceLow = normalizePrice(value.priceLow);
  let priceHigh = normalizePrice(value.priceHigh);
  let recommendedPrice = normalizePrice(value.recommendedPrice);

  if (priceLow !== null && priceHigh !== null && priceHigh < priceLow) {
    [priceLow, priceHigh] = [priceHigh, priceLow];
  }

  if (recommendedPrice === null && priceLow !== null && priceHigh !== null) {
    recommendedPrice = Math.round((priceLow + priceHigh) / 2);
  }

  if (recommendedPrice !== null && priceLow !== null && recommendedPrice < priceLow) {
    recommendedPrice = priceLow;
  }

  if (recommendedPrice !== null && priceHigh !== null && recommendedPrice > priceHigh) {
    recommendedPrice = priceHigh;
  }

  return {
    priceLow,
    priceHigh,
    recommendedPrice
  };
}

function fallbackFacebookText(suggestion: Pick<AiListingDraftSuggestion, "suggestedTitle" | "suggestedDescription">) {
  return [
    suggestion.suggestedTitle,
    "",
    suggestion.suggestedDescription,
    "",
    "Dogovor ide direktno preko oglasa na Buvljak.hr."
  ]
    .join("\n")
    .slice(0, 900)
    .trim();
}

function normalizeAiDraft(
  value: JsonRecord,
  args: {
    listingType?: ListingType;
    existingTitle?: string;
    existingDescription?: string;
    existingCategory?: string;
  }
): AiListingDraftSuggestion {
  const suggestedTitle = clipText(value.suggestedTitle, 90, args.existingTitle ?? "Predmet s fotografije");
  const suggestedDescription = clipMultilineText(
    value.suggestedDescription,
    900,
    args.existingDescription ?? "Dodaj kratak opis predmeta, stanje i gdje se može preuzeti."
  );
  const suggestedCategory = clipText(value.suggestedCategory, 60, args.existingCategory ?? "Ostalo");
  const suggestedCondition = normalizeCondition(value.suggestedCondition);
  const prices = normalizePrices(value, args.listingType);
  const priceConfidence =
    prices.priceLow === null && prices.priceHigh === null && prices.recommendedPrice === null
      ? "low"
      : normalizeConfidence(value.priceConfidence, "low");
  const priceRationale = clipText(
    value.priceRationale,
    280,
    "Cijena je samo okvirni prijedlog i treba je ručno provjeriti."
  );
  const shouldAllowOffers =
    args.listingType === "give"
      ? false
      : typeof value.shouldAllowOffers === "boolean"
        ? value.shouldAllowOffers
        : priceConfidence !== "high";
  const warnings = uniqueWarnings(value.warnings);

  if (!warnings.some((warning) => warning.toLowerCase().includes("okvir"))) {
    warnings.unshift("Okvirna cijena nije službena procjena vrijednosti.");
  }

  const suggestion = {
    suggestedTitle,
    suggestedDescription,
    suggestedCategory,
    suggestedCondition,
    ...prices,
    priceConfidence,
    priceRationale,
    shouldAllowOffers,
    facebookText: "",
    warnings: warnings.slice(0, 6),
    confidence: normalizeConfidence(value.confidence, "low")
  };

  return {
    ...suggestion,
    facebookText: clipMultilineText(value.facebookText, 900, fallbackFacebookText(suggestion))
  };
}

function buildPrompt(args: {
  listingType?: ListingType;
  existingTitle?: string;
  existingDescription?: string;
  existingCategory?: string;
  localContext: string;
}) {
  return JSON.stringify({
    role: "AI pomoćnik za hrvatski lokalni marketplace Buvljak.hr.",
    task:
      "Na temelju 1 do 3 fotografije predmeta pripremi prijedlog oglasa i okvirni prijedlog cijene. Vrati isključivo JSON objekt bez markdowna.",
    localContext: args.localContext,
    listingType: args.listingType ?? null,
    existingTitle: optionalClippedText(args.existingTitle, 120) ?? null,
    existingDescription: optionalClippedText(args.existingDescription, 600) ?? null,
    existingCategory: optionalClippedText(args.existingCategory, 80) ?? null,
    outputSchema: {
      suggestedTitle: "string",
      suggestedDescription: "string",
      suggestedCategory: "string",
      suggestedCondition: "new | used | damaged | unknown",
      priceLow: "number | null",
      priceHigh: "number | null",
      recommendedPrice: "number | null",
      priceConfidence: "low | medium | high",
      priceRationale: "string",
      shouldAllowOffers: "boolean",
      facebookText: "string",
      warnings: "string[]",
      confidence: "low | medium | high"
    },
    rules: [
      "Piši jednostavnim hrvatskim tonom za obične korisnike.",
      "Ne tvrdi da je cijena službena procjena vrijednosti; koristi okvirna cijena ili prijedlog cijene.",
      "Ako predmet nije dovoljno prepoznat, cijene vrati kao null i confidence postavi na low.",
      "Cijene su u eurima i za lokalni kontekst Nova Gradiška i okolica.",
      "Za listingType give cijene moraju biti null i shouldAllowOffers mora biti false.",
      "Za listingType swap fokusiraj se na opis i zamjenu; cijena smije biti null.",
      "Za listingType want cijena je eventualni budžet/prijedlog, ne prodajna cijena.",
      "Ne izmišljaj marku, model, oštećenja, garanciju ili kontakt ako se ne vidi jasno.",
      "Ako fotografija sadrži osobne podatke, lica, dokumente, tablice ili kontakte, ignoriraj ih i dodaj warning.",
      "Ne vraćaj telefon, email, Facebook URL, ime osobe, user ID ni privatne podatke."
    ]
  });
}

async function fetchOpenAiDraft(params: {
  apiKey: string;
  model: string;
  prompt: string;
  imageUrls: string[];
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    return await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: params.model,
        temperature: 0.2,
        max_output_tokens: 900,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: params.prompt
              },
              ...params.imageUrls.map((imageUrl) => ({
                type: "input_image",
                image_url: imageUrl,
                detail: "low"
              }))
            ]
          }
        ]
      })
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const analyzeListingImagesForDraft = action({
  args: {
    imageStorageIds: v.array(v.id("_storage")),
    listingType: v.optional(listingTypeValidator),
    existingTitle: v.optional(v.string()),
    existingDescription: v.optional(v.string()),
    existingCategory: v.optional(v.string()),
    localContext: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<AiListingDraftSuggestion> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.tokenIdentifier) {
      throw new ConvexError(AI_LOGIN_MESSAGE);
    }

    if (args.imageStorageIds.length < 1 || args.imageStorageIds.length > 3) {
      throw new ConvexError(AI_INVALID_IMAGES_MESSAGE);
    }

    if (isFeatureDisabled(process.env.AI_LISTING_ASSISTANT_ENABLED)) {
      throw new ConvexError(AI_DISABLED_MESSAGE);
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      throw new ConvexError(AI_DISABLED_MESSAGE);
    }

    const imageUrls: string[] = [];

    for (const storageId of args.imageStorageIds) {
      const imageUrl = await ctx.storage.getUrl(storageId);

      if (!imageUrl) {
        throw new ConvexError(AI_IMAGE_URL_MESSAGE);
      }

      imageUrls.push(imageUrl);
    }

    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
    const prompt = buildPrompt({
      listingType: args.listingType,
      existingTitle: args.existingTitle,
      existingDescription: args.existingDescription,
      existingCategory: args.existingCategory,
      localContext: cleanLine(args.localContext ?? DEFAULT_LOCAL_CONTEXT) || DEFAULT_LOCAL_CONTEXT
    });

    try {
      const response = await fetchOpenAiDraft({
        apiKey,
        model,
        prompt,
        imageUrls
      });

      if (!response.ok) {
        console.warn("aiListingAssistant", {
          status: "failure",
          errorCode: "openai_http_error",
          imageCount: imageUrls.length,
          model,
          httpStatus: response.status
        });
        throw new ConvexError(AI_RESPONSE_MESSAGE);
      }

      const text = extractOutputText((await response.json()) as ResponsesApiResponse);
      const parsed = text ? tryParseJsonObject(text) : undefined;

      if (!parsed) {
        console.warn("aiListingAssistant", {
          status: "failure",
          errorCode: "invalid_ai_json",
          imageCount: imageUrls.length,
          model
        });
        throw new ConvexError(AI_RESPONSE_MESSAGE);
      }

      const normalized = normalizeAiDraft(parsed, {
        listingType: args.listingType,
        existingTitle: optionalClippedText(args.existingTitle, 90),
        existingDescription: args.existingDescription?.slice(0, 900),
        existingCategory: optionalClippedText(args.existingCategory, 60)
      });

      console.info("aiListingAssistant", {
        status: "success",
        imageCount: imageUrls.length,
        model
      });

      return normalized;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      console.warn("aiListingAssistant", {
        status: "failure",
        errorCode: error instanceof Error && error.name === "AbortError" ? "openai_timeout" : "openai_request_failed",
        imageCount: imageUrls.length,
        model
      });
      throw new ConvexError(AI_RESPONSE_MESSAGE);
    }
  }
});
