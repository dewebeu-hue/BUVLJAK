import { ConvexError, v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { aiUsageActionValidator, aiUsageStatusValidator, listingTypeValidator } from "./validators";

type ListingType = "sell" | "give" | "swap" | "want";
type SuggestedCondition = "new" | "used" | "damaged" | "unknown";
type Confidence = "low" | "medium" | "high";
type AiUsageStatus = "success" | "failed" | "rate_limited" | "disabled";

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
type PrepareAiListingSuggestionResult =
  | {
      ok: false;
      displayMessage: string;
    }
  | {
      ok: true;
      userId: string;
      imageCount: number;
      approximateInputBytes?: number;
    };

const DEFAULT_LOCAL_CONTEXT = "Nova Gradiška i okolica";
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_AI_MAX_IMAGES = 3;
const DEFAULT_AI_DAILY_LIMIT_FREE = 1;
const DEFAULT_AI_WEEKLY_LIMIT_FREE = 5;
const DEFAULT_AI_GLOBAL_DAILY_LIMIT = 100;
const AI_DISABLED_MESSAGE = "AI prijedlog trenutno nije dostupan. Oglas možeš nastaviti ručno.";
const AI_LOGIN_MESSAGE = "Za AI prijedlog moraš biti prijavljen.";
const AI_INVALID_IMAGES_MESSAGE = "Dodaj 1 do 3 slike za AI prijedlog.";
const AI_IMAGE_URL_MESSAGE = "Slike trenutno nije moguće pripremiti. Oglas možeš nastaviti ručno.";
const AI_RESPONSE_MESSAGE = "AI prijedlog trenutno nije moguće pripremiti. Oglas možeš nastaviti ručno.";
const AI_DAILY_LIMIT_MESSAGE = "Danas si iskoristio/la besplatni AI prijedlog. Oglas možeš nastaviti ručno.";
const AI_WEEKLY_LIMIT_MESSAGE =
  "Ovaj tjedan si iskoristio/la besplatne AI prijedloge. Oglas možeš nastaviti ručno.";
const AI_GLOBAL_LIMIT_MESSAGE = "AI prijedlozi su danas iskorišteni. Oglas možeš nastaviti ručno.";
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

function integerEnv(name: string, fallback: number) {
  const rawValue = process.env[name];

  if (rawValue === undefined || !rawValue.trim()) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function getServerAiMaxImages() {
  return Math.min(Math.max(integerEnv("AI_MAX_IMAGES", DEFAULT_AI_MAX_IMAGES), 1), DEFAULT_AI_MAX_IMAGES);
}

function getAiDailyLimitForUser(_userId: string) {
  void _userId;
  return integerEnv("AI_DAILY_LIMIT_FREE", DEFAULT_AI_DAILY_LIMIT_FREE);
}

function getAiWeeklyLimitForUser(_userId: string) {
  void _userId;
  // TODO: Featured listing entitlement can raise weekly AI credits to 5 during active 7-day highlight period.
  return integerEnv("AI_WEEKLY_LIMIT_FREE", DEFAULT_AI_WEEKLY_LIMIT_FREE);
}

function getAiGlobalDailyLimit() {
  return integerEnv("AI_GLOBAL_DAILY_LIMIT", DEFAULT_AI_GLOBAL_DAILY_LIMIT);
}

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

async function approximateStorageBytes(ctx: MutationCtx, imageStorageIds: Array<Id<"_storage">>) {
  let total = 0;

  for (const storageId of imageStorageIds) {
    const metadata = await ctx.db.system.get("_storage", storageId);
    if (metadata?.size) {
      total += metadata.size;
    }
  }

  return total > 0 ? total : undefined;
}

async function countUserAiEvents(
  ctx: MutationCtx,
  args: {
    userId: string;
    status: AiUsageStatus;
    since: number;
    limit: number;
  }
) {
  if (args.limit <= 0) {
    return 0;
  }

  const events = await ctx.db
    .query("aiUsageEvents")
    .withIndex("by_userId_action_status_createdAt", (q) =>
      q
        .eq("userId", args.userId)
        .eq("action", "listing_suggestion")
        .eq("status", args.status)
        .gte("createdAt", args.since)
    )
    .take(args.limit);

  return events.length;
}

async function countGlobalAiEvents(
  ctx: MutationCtx,
  args: {
    status: AiUsageStatus;
    since: number;
    limit: number;
  }
) {
  if (args.limit <= 0) {
    return 0;
  }

  const events = await ctx.db
    .query("aiUsageEvents")
    .withIndex("by_action_status_createdAt", (q) =>
      q.eq("action", "listing_suggestion").eq("status", args.status).gte("createdAt", args.since)
    )
    .take(args.limit);

  return events.length;
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

export const prepareAiListingSuggestionRequest = internalMutation({
  args: {
    imageStorageIds: v.array(v.id("_storage")),
    model: v.string()
  },
  handler: async (ctx, args): Promise<PrepareAiListingSuggestionResult> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.tokenIdentifier) {
      return {
        ok: false as const,
        displayMessage: AI_LOGIN_MESSAGE
      };
    }

    const now = Date.now();
    const userId = identity.tokenIdentifier;
    const imageCount = args.imageStorageIds.length;
    const maxImages = getServerAiMaxImages();
    const approximateInputBytes = await approximateStorageBytes(ctx, args.imageStorageIds);

    async function logBlocked(status: "failed" | "rate_limited" | "disabled", errorCode: string) {
      await ctx.db.insert("aiUsageEvents", {
        userId,
        action: "listing_suggestion",
        imageCount,
        status,
        model: args.model,
        errorCode,
        ...(approximateInputBytes !== undefined ? { approximateInputBytes } : {}),
        createdAt: now
      });
    }

    if (imageCount < 1 || imageCount > maxImages) {
      await logBlocked("failed", "invalid_image_count");
      return {
        ok: false as const,
        displayMessage: AI_INVALID_IMAGES_MESSAGE
      };
    }

    if (isFeatureDisabled(process.env.AI_LISTING_ASSISTANT_ENABLED)) {
      await logBlocked("disabled", "feature_disabled");
      return {
        ok: false as const,
        displayMessage: AI_DISABLED_MESSAGE
      };
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      await logBlocked("disabled", "missing_openai_api_key");
      return {
        ok: false as const,
        displayMessage: AI_DISABLED_MESSAGE
      };
    }

    const dayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const todayStart = startOfUtcDay(now);
    const dailyLimit = getAiDailyLimitForUser(userId);
    const weeklyLimit = getAiWeeklyLimitForUser(userId);
    const globalDailyLimit = getAiGlobalDailyLimit();

    const [dailySuccessCount, dailyRateLimitedCount] = await Promise.all([
      countUserAiEvents(ctx, {
        userId,
        status: "success",
        since: dayAgo,
        limit: dailyLimit
      }),
      countUserAiEvents(ctx, {
        userId,
        status: "rate_limited",
        since: dayAgo,
        limit: dailyLimit
      })
    ]);

    if (dailySuccessCount + dailyRateLimitedCount >= dailyLimit) {
      await logBlocked("rate_limited", "user_daily_limit");
      return {
        ok: false as const,
        displayMessage: AI_DAILY_LIMIT_MESSAGE
      };
    }

    const weeklySuccessCount = await countUserAiEvents(ctx, {
      userId,
      status: "success",
      since: sevenDaysAgo,
      limit: weeklyLimit
    });

    if (weeklySuccessCount >= weeklyLimit) {
      await logBlocked("rate_limited", "user_weekly_limit");
      return {
        ok: false as const,
        displayMessage: AI_WEEKLY_LIMIT_MESSAGE
      };
    }

    const globalDailySuccessCount = await countGlobalAiEvents(ctx, {
      status: "success",
      since: todayStart,
      limit: globalDailyLimit
    });

    if (globalDailySuccessCount >= globalDailyLimit) {
      await logBlocked("rate_limited", "global_daily_limit");
      return {
        ok: false as const,
        displayMessage: AI_GLOBAL_LIMIT_MESSAGE
      };
    }

    return {
      ok: true as const,
      userId,
      imageCount,
      approximateInputBytes
    };
  }
});

export const recordAiUsageEvent = internalMutation({
  args: {
    userId: v.string(),
    action: aiUsageActionValidator,
    imageCount: v.number(),
    status: aiUsageStatusValidator,
    model: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    approximateInputBytes: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsageEvents", {
      userId: args.userId,
      action: args.action,
      imageCount: args.imageCount,
      status: args.status,
      ...(args.model ? { model: args.model } : {}),
      ...(args.errorCode ? { errorCode: args.errorCode } : {}),
      ...(args.approximateInputBytes !== undefined
        ? { approximateInputBytes: args.approximateInputBytes }
        : {}),
      createdAt: Date.now()
    });
  }
});

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
    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
    const prepared = await ctx.runMutation(internal.aiListingAssistant.prepareAiListingSuggestionRequest, {
      imageStorageIds: args.imageStorageIds,
      model
    });

    if (!prepared.ok) {
      throw new ConvexError(prepared.displayMessage);
    }

    const usageUserId = prepared.userId;
    const usageImageCount = prepared.imageCount;
    const usageApproximateInputBytes = prepared.approximateInputBytes;

    async function recordUsage(status: AiUsageStatus, errorCode?: string) {
      await ctx.runMutation(internal.aiListingAssistant.recordAiUsageEvent, {
        userId: usageUserId,
        action: "listing_suggestion",
        imageCount: usageImageCount,
        status,
        model,
        ...(errorCode ? { errorCode } : {}),
        ...(usageApproximateInputBytes !== undefined
          ? { approximateInputBytes: usageApproximateInputBytes }
          : {})
      });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      await recordUsage("disabled", "missing_openai_api_key_after_prepare");
      throw new ConvexError(AI_DISABLED_MESSAGE);
    }

    const imageUrls: string[] = [];

    try {
      for (const storageId of args.imageStorageIds) {
        const imageUrl = await ctx.storage.getUrl(storageId);

        if (!imageUrl) {
          await recordUsage("failed", "image_url_unavailable");
          throw new ConvexError(AI_IMAGE_URL_MESSAGE);
        }

        imageUrls.push(imageUrl);
      }

      const prompt = buildPrompt({
        listingType: args.listingType,
        existingTitle: args.existingTitle,
        existingDescription: args.existingDescription,
        existingCategory: args.existingCategory,
        localContext: cleanLine(args.localContext ?? DEFAULT_LOCAL_CONTEXT) || DEFAULT_LOCAL_CONTEXT
      });

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
        await recordUsage("failed", "openai_http_error");
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
        await recordUsage("failed", "invalid_ai_json");
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

      await recordUsage("success");
      return normalized;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }

      const errorCode = error instanceof Error && error.name === "AbortError" ? "openai_timeout" : "openai_request_failed";
      console.warn("aiListingAssistant", {
        status: "failure",
        errorCode,
        imageCount: imageUrls.length,
        model
      });
      await recordUsage("failed", errorCode);
      throw new ConvexError(AI_RESPONSE_MESSAGE);
    }
  }
});
