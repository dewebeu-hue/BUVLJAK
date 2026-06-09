import { ConvexError, v } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { listingTypeValidator, notificationStatusValidator } from "./validators";
import { getPublicListingUrl } from "../lib/public-urls";

const DEFAULT_CITY = "Nova Gradiška";
const DEFAULT_MATCH_LIMIT = 20;
const MAX_MATCH_LIMIT = 50;
const MAX_EMAILS_PER_RUN = 50;
const LISTINGS_PER_EMAIL = 5;

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;
type ConvexCtx = QueryCtx | MutationCtx;
type ListingType = Doc<"listings">["type"];

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalized(value?: string) {
  return optionalString(value)?.toLocaleLowerCase("hr-HR") ?? "";
}

function clampLimit(limit?: number) {
  if (limit === undefined) {
    return DEFAULT_MATCH_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_MATCH_LIMIT);
}

function cleanMaxPrice(value?: number) {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new ConvexError("Max price must be a positive number.");
  }

  return Math.round(value * 100) / 100;
}

function cleanSearchInput(args: {
  query?: string;
  city?: string;
  category?: string;
  type?: ListingType;
  maxPrice?: number;
  notifyByEmail?: boolean;
  isActive?: boolean;
}) {
  const queryText = optionalString(args.query) ?? "";
  const city = optionalString(args.city);
  const category = optionalString(args.category);
  const maxPrice = cleanMaxPrice(args.maxPrice);
  const hasExplicitFilter = Boolean(city || category || args.type || maxPrice !== undefined);

  if (!queryText && !hasExplicitFilter) {
    throw new ConvexError("Upiši pojam ili odaberi barem jedan filter za spremanje potrage.");
  }

  return {
    query: queryText,
    city: city ?? DEFAULT_CITY,
    ...(category ? { category } : {}),
    ...(args.type ? { type: args.type } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    notifyByEmail: args.notifyByEmail ?? true,
    isActive: args.isActive ?? true
  };
}

async function getCurrentUser(ctx: ConvexCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Authentication is required.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError("User profile is not ready yet.");
  }

  return user;
}

async function getOrCreateCurrentUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Authentication is required.");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const displayName =
    optionalString(identity.name) ??
    optionalString(identity.email) ??
    "Korisnik Buvljaka";
  const email = optionalString(identity.email);
  const city = optionalString(identity.city);

  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    displayName,
    ...(email ? { email } : {}),
    ...(city ? { city } : {}),
    createdAt: now,
    updatedAt: now,
    role: "user",
    plan: "free"
  });

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new ConvexError("Could not create user profile.");
  }

  return user;
}

async function requireOwnedSearch(ctx: ConvexCtx, searchId: Id<"savedSearches">) {
  const user = await getCurrentUser(ctx);
  const search = await ctx.db.get(searchId);

  if (!search || search.userId !== user._id) {
    throw new ConvexError("Saved search not found.");
  }

  return { user, search };
}

async function requireAdmin(ctx: ConvexCtx) {
  const user = await getCurrentUser(ctx);

  // TODO: Move admin protection to a route-level Clerk/Convex guard before live operations.
  if (user.role !== "admin") {
    throw new ConvexError("Admin access is required.");
  }

  return user;
}

export function matchesSavedSearch(search: Doc<"savedSearches">, listing: Doc<"listings">) {
  if (listing.status !== "active") {
    return false;
  }

  if (search.type && listing.type !== search.type) {
    return false;
  }

  if (search.city && normalized(listing.city) !== normalized(search.city)) {
    return false;
  }

  if (search.category && normalized(listing.category) !== normalized(search.category)) {
    return false;
  }

  if (typeof search.maxPrice === "number") {
    if (typeof listing.price !== "number" || listing.price > search.maxPrice) {
      return false;
    }
  }

  const queryText = optionalString(search.query);

  if (queryText) {
    const haystack = normalized(`${listing.title} ${listing.description}`);
    if (!haystack.includes(normalized(queryText))) {
      return false;
    }
  }

  return true;
}

function publicSearchPayload(search: Doc<"savedSearches">, matchCount = 0) {
  return {
    id: search._id,
    query: search.query,
    city: search.city,
    category: search.category,
    type: search.type,
    maxPrice: search.maxPrice,
    isActive: search.isActive,
    notifyByEmail: search.notifyByEmail ?? true,
    lastNotifiedAt: search.lastNotifiedAt,
    createdAt: search.createdAt,
    updatedAt: search.updatedAt,
    matchCount
  };
}

function publicListingMatchPayload(listing: Doc<"listings">) {
  return {
    id: listing._id,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    type: listing.type,
    price: listing.price,
    priceType: listing.priceType,
    createdAt: listing.createdAt
  };
}

async function listActiveListings(ctx: QueryCtx) {
  return await ctx.db
    .query("listings")
    .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
    .order("desc")
    .collect();
}

export const listMySavedSearches = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const [searches, listings] = await Promise.all([
      ctx.db
        .query("savedSearches")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect(),
      listActiveListings(ctx)
    ]);

    return searches
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((search) =>
        publicSearchPayload(
          search,
          listings.filter((listing) => matchesSavedSearch(search, listing)).length
        )
      );
  }
});

export const getSavedSearchMatches = query({
  args: {
    id: v.id("savedSearches"),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { search } = await requireOwnedSearch(ctx, args.id);
    const limit = clampLimit(args.limit);
    const listings = await listActiveListings(ctx);

    return listings
      .filter((listing) => matchesSavedSearch(search, listing))
      .slice(0, limit)
      .map(publicListingMatchPayload);
  }
});

export const createSavedSearch = mutation({
  args: {
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(listingTypeValidator),
    maxPrice: v.optional(v.number()),
    notifyByEmail: v.optional(v.boolean()),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateCurrentUser(ctx);
    const cleaned = cleanSearchInput(args);
    const now = Date.now();

    return await ctx.db.insert("savedSearches", {
      userId: user._id,
      ...cleaned,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateSavedSearch = mutation({
  args: {
    id: v.id("savedSearches"),
    query: v.optional(v.string()),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(listingTypeValidator),
    maxPrice: v.optional(v.number()),
    notifyByEmail: v.optional(v.boolean()),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { search } = await requireOwnedSearch(ctx, args.id);
    const cleaned = cleanSearchInput({
      query: args.query ?? search.query,
      city: args.city ?? search.city,
      category: args.category ?? search.category,
      type: args.type ?? search.type,
      maxPrice: args.maxPrice ?? search.maxPrice,
      notifyByEmail: args.notifyByEmail ?? search.notifyByEmail ?? true,
      isActive: args.isActive ?? search.isActive
    });

    await ctx.db.patch(args.id, {
      ...cleaned,
      updatedAt: Date.now()
    });

    return args.id;
  }
});

export const deleteSavedSearch = mutation({
  args: {
    id: v.id("savedSearches")
  },
  handler: async (ctx, args) => {
    await requireOwnedSearch(ctx, args.id);
    await ctx.db.delete(args.id);
    return args.id;
  }
});

export const toggleSavedSearchActive = mutation({
  args: {
    id: v.id("savedSearches"),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const { search } = await requireOwnedSearch(ctx, args.id);
    const isActive = args.isActive ?? !search.isActive;

    await ctx.db.patch(args.id, {
      isActive,
      updatedAt: Date.now()
    });

    return isActive;
  }
});

export const getSavedSearchNotificationStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [searches, events] = await Promise.all([
      ctx.db.query("savedSearches").collect(),
      ctx.db.query("notificationEvents").collect()
    ]);

    return {
      totalSearches: searches.length,
      activeSearches: searches.filter((search) => search.isActive).length,
      sent: events.filter((event) => event.status === "sent").length,
      failedOrSkipped: events.filter(
        (event) => event.status === "failed" || event.status === "skipped"
      ).length
    };
  }
});

export const requireNotificationAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return true;
  }
});

export const prepareSavedSearchNotifications = internalQuery({
  args: {
    maxEmails: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const maxEmails = Math.min(
      Math.max(Math.floor(args.maxEmails ?? MAX_EMAILS_PER_RUN), 1),
      MAX_EMAILS_PER_RUN
    );
    const [searches, listings] = await Promise.all([
      ctx.db
        .query("savedSearches")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect(),
      listActiveListings(ctx)
    ]);
    const jobs = [];

    for (const search of searches) {
      if (jobs.length >= maxEmails) {
        break;
      }

      if (!(search.notifyByEmail ?? true)) {
        continue;
      }

      const matches = listings
        .filter((listing) => matchesSavedSearch(search, listing))
        .slice(0, LISTINGS_PER_EMAIL);
      const newMatches = [];

      for (const listing of matches) {
        const existing = await ctx.db
          .query("notificationEvents")
          .withIndex("by_savedSearch_listing", (q) =>
            q.eq("savedSearchId", search._id).eq("listingId", listing._id)
          )
          .first();

        if (!existing) {
          newMatches.push(listing);
        }
      }

      if (newMatches.length === 0) {
        continue;
      }

      const user = search.userId ? await ctx.db.get(search.userId) : null;

      jobs.push({
        savedSearchId: search._id,
        userId: user?._id,
        userEmail: user?.email,
        displayName: user?.displayName,
        search: publicSearchPayload(search),
        listings: newMatches.map(publicListingMatchPayload)
      });
    }

    return {
      checkedSearches: searches.length,
      jobs
    };
  }
});

export const recordSavedSearchNotificationResult = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    savedSearchId: v.id("savedSearches"),
    listingIds: v.array(v.id("listings")),
    status: notificationStatusValidator,
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const listingId of args.listingIds) {
      const existing = await ctx.db
        .query("notificationEvents")
        .withIndex("by_savedSearch_listing", (q) =>
          q.eq("savedSearchId", args.savedSearchId).eq("listingId", listingId)
        )
        .first();

      if (existing) {
        continue;
      }

      await ctx.db.insert("notificationEvents", {
        ...(args.userId ? { userId: args.userId } : {}),
        savedSearchId: args.savedSearchId,
        listingId,
        channel: "email",
        status: args.status,
        ...(optionalString(args.reason) ? { reason: optionalString(args.reason) } : {}),
        createdAt: now
      });
    }

    if (args.status === "sent") {
      await ctx.db.patch(args.savedSearchId, {
        lastNotifiedAt: now,
        updatedAt: now
      });
    }
  }
});

export const runSavedSearchNotificationsNow = action({
  args: {
    maxEmails: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.savedSearches.requireNotificationAdmin, {});

    const prepared = await ctx.runQuery(internal.savedSearches.prepareSavedSearchNotifications, {
      maxEmails: args.maxEmails
    });
    const apiKey = optionalString(process.env.RESEND_API_KEY);
    const from = optionalString(process.env.CONTACT_FROM_EMAIL);
    const result = {
      checkedSearches: prepared.checkedSearches,
      attemptedEmails: prepared.jobs.length,
      sent: 0,
      skipped: 0,
      failed: 0
    };

    for (const job of prepared.jobs) {
      const listingIds = job.listings.map(
        (listing: ReturnType<typeof publicListingMatchPayload>) => listing.id
      );

      if (!job.userEmail) {
        result.skipped += 1;
        await ctx.runMutation(internal.savedSearches.recordSavedSearchNotificationResult, {
          userId: job.userId,
          savedSearchId: job.savedSearchId,
          listingIds,
          status: "skipped",
          reason: "User does not have an email address."
        });
        continue;
      }

      if (!apiKey || !from) {
        result.skipped += 1;
        await ctx.runMutation(internal.savedSearches.recordSavedSearchNotificationResult, {
          userId: job.userId,
          savedSearchId: job.savedSearchId,
          listingIds,
          status: "skipped",
          reason: "Resend is not configured."
        });
        continue;
      }

      const sent = await sendSavedSearchEmail({
        apiKey,
        from,
        to: job.userEmail,
        displayName: job.displayName,
        search: job.search,
        listings: job.listings
      });

      await ctx.runMutation(internal.savedSearches.recordSavedSearchNotificationResult, {
        userId: job.userId,
        savedSearchId: job.savedSearchId,
        listingIds,
        status: sent ? "sent" : "failed",
        ...(sent ? {} : { reason: "Resend email request failed." })
      });

      if (sent) {
        result.sent += 1;
      } else {
        result.failed += 1;
      }
    }

    return result;
  }
});

async function sendSavedSearchEmail({
  apiKey,
  from,
  to,
  displayName,
  search,
  listings
}: {
  apiKey: string;
  from: string;
  to: string;
  displayName?: string;
  search: ReturnType<typeof publicSearchPayload>;
  listings: ReturnType<typeof publicListingMatchPayload>[];
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Novi oglasi za tvoju potragu na Buvljaku",
      text: buildEmailText({ displayName, search, listings })
    })
  });

  return response.ok;
}

function buildEmailText({
  displayName,
  search,
  listings
}: {
  displayName?: string;
  search: ReturnType<typeof publicSearchPayload>;
  listings: ReturnType<typeof publicListingMatchPayload>[];
}) {
  const greeting = displayName ? `Pozdrav ${displayName},` : "Pozdrav,";
  const listingLines = listings.map((listing, index) =>
    [
      `${index + 1}. ${listing.title}`,
      `   ${listingPriceLabel(listing)} · ${listing.city}`,
      `   ${getPublicListingUrl(listing.id)}`
    ].join("\n")
  );

  return [
    greeting,
    "",
    `Pojavili su se novi oglasi za tvoju potragu: ${describeSearch(search)}.`,
    "",
    ...listingLines,
    "",
    `Pogledaj oglase: ${getSavedSearchUrl(search)}`,
    "",
    "Ovu obavijest primaš jer si spremio/la potragu na Buvljaku.",
    "U potrazi možeš pauzirati obavijesti, isključiti email ili obrisati potragu."
  ].join("\n");
}

function describeSearch(search: ReturnType<typeof publicSearchPayload>) {
  const parts = [
    optionalString(search.query) ? `"${search.query}"` : undefined,
    search.type ? listingTypeLabel(search.type) : undefined,
    optionalString(search.city),
    optionalString(search.category),
    typeof search.maxPrice === "number" ? `do ${formatEuro(search.maxPrice)}` : undefined
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "tvoja spremljena potraga";
}

function getSavedSearchUrl(search: ReturnType<typeof publicSearchPayload>) {
  const params = new URLSearchParams();
  const queryText = optionalString(search.query);
  const city = optionalString(search.city);
  const category = optionalString(search.category);

  if (queryText) {
    params.set("q", queryText);
  }
  if (city) {
    params.set("city", city);
  }
  if (category) {
    params.set("category", category);
  }
  if (search.type) {
    params.set("type", search.type);
  }
  if (typeof search.maxPrice === "number") {
    params.set("maxPrice", String(search.maxPrice));
  }

  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/oglasi${
    params.toString() ? `?${params.toString()}` : ""
  }`;
}

function listingTypeLabel(type: ListingType) {
  const labels: Record<ListingType, string> = {
    sell: "Prodajem",
    give: "Poklanjam",
    swap: "Mijenjam",
    want: "Tražim"
  };

  return labels[type];
}

function listingPriceLabel(listing: ReturnType<typeof publicListingMatchPayload>) {
  if (typeof listing.price === "number") {
    return `${listingTypeLabel(listing.type)} · ${formatEuro(listing.price)}`;
  }

  return listingTypeLabel(listing.type);
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}
