import { ConvexError, v } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { mutation, query } from "./_generated/server";
import type { DataModel, Doc } from "./_generated/dataModel";
import {
  contactMethodValidator,
  featuredLabelValidator,
  listingStatusValidator,
  listingTypeValidator,
  priceTypeValidator
} from "./validators";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function cleanRequired(value: string, fieldName: string, minLength = 2) {
  const cleaned = value.trim();

  if (cleaned.length < minLength) {
    throw new ConvexError(`${fieldName} is required.`);
  }

  return cleaned;
}

function cleanOptional(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function scrubImportedText(value?: string) {
  const cleaned = cleanOptional(value);

  if (!cleaned) {
    return undefined;
  }

  return cleaned
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email skriven]")
    .replace(/(?:\+?\d[\s().-]?){7,}\d/g, "[telefon skriven]")
    .slice(0, 2000);
}

function clampLimit(limit?: number) {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

function effectivePrice(listing: Doc<"listings">) {
  if (typeof listing.price === "number") {
    return listing.price;
  }

  return listing.priceType === "free" ? 0 : undefined;
}

function matchesListingFilters(
  listing: Doc<"listings">,
  args: {
    city?: string;
    type?: Doc<"listings">["type"];
    category?: string;
    maxPrice?: number;
  }
) {
  if (args.city && listing.city !== args.city) {
    return false;
  }

  if (args.type && listing.type !== args.type) {
    return false;
  }

  if (args.category && listing.category !== args.category) {
    return false;
  }

  if (typeof args.maxPrice === "number") {
    const price = effectivePrice(listing);
    if (price === undefined || price > args.maxPrice) {
      return false;
    }
  }

  return true;
}

function defaultPriceType(type: Doc<"listings">["type"], price?: number): Doc<"listings">["priceType"] {
  if (type === "give") {
    return "free";
  }

  if (type === "swap") {
    return "swap";
  }

  if (type === "want") {
    return "wanted";
  }

  return price === undefined ? "negotiable" : "fixed";
}

async function getOrCreateCurrentUser(ctx: GenericMutationCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Authentication is required.");
  }

  const now = Date.now();
  const clerkUserId = identity.subject;
  const fullName = optionalString(
    [optionalString(identity.givenName), optionalString(identity.familyName)]
      .filter(Boolean)
      .join(" ")
  );
  const displayName =
    optionalString(identity.name) ??
    fullName ??
    optionalString(identity.preferredUsername) ??
    optionalString(identity.nickname) ??
    optionalString(identity.email) ??
    "Korisnik Buvljaka";
  const email = optionalString(identity.email);
  const city = optionalString(identity.city);

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      displayName,
      ...(email !== undefined ? { email } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(existing.plan === undefined ? { plan: "free" } : {}),
      updatedAt: now
    });

    return existing;
  }

  const userId = await ctx.db.insert("users", {
    clerkUserId,
    displayName,
    ...(email !== undefined ? { email } : {}),
    ...(city !== undefined ? { city } : {}),
    createdAt: now,
    updatedAt: now,
    role: "user",
    plan: "free"
  });

  return await ctx.db.get(userId);
}

async function getCurrentUser(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();
}

async function getReporterUser(ctx: GenericMutationCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();
}

async function withListingPresentation(
  ctx: GenericQueryCtx<DataModel>,
  listing: Doc<"listings">
) {
  const [currentUser, owner, imageUrls] = await Promise.all([
    getCurrentUser(ctx),
    listing.ownerId ? ctx.db.get(listing.ownerId) : Promise.resolve(null),
    Promise.all(
      listing.images.map(async (imageId) => {
        try {
          return await ctx.storage.getUrl(imageId);
        } catch {
          return null;
        }
      })
    )
  ]);

  return {
    _id: listing._id,
    _creationTime: listing._creationTime,
    ownerId: listing.ownerId,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    ...(listing.price !== undefined ? { price: listing.price } : {}),
    priceType: listing.priceType,
    status: listing.status,
    contactMethod: listing.contactMethod,
    contactVisibility: listing.contactVisibility,
    allowOffers: listing.allowOffers,
    images: listing.images,
    viewCount: listing.viewCount,
    contactClickCount: listing.contactClickCount,
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    isFeatured: listing.isFeatured,
    featuredUntil: listing.featuredUntil,
    featuredLabel: listing.featuredLabel,
    featuredCreatedAt: listing.featuredCreatedAt,
    importSource: listing.importSource,
    importParsedAt: listing.importParsedAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    resolvedAt: listing.resolvedAt,
    removedReason: listing.removedReason,
    imageUrls: imageUrls.filter((url): url is string => Boolean(url)),
    ownerDisplayName: owner?.displayName,
    isOwner: Boolean(currentUser && listing.ownerId === currentUser._id)
  };
}

async function withPublicListingPresentation(
  ctx: GenericQueryCtx<DataModel>,
  listing: Doc<"listings">
) {
  const imageUrls = await Promise.all(
    listing.images.map(async (imageId) => {
      try {
        return await ctx.storage.getUrl(imageId);
      } catch {
        return null;
      }
    })
  );

  return {
    id: listing._id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    ...(listing.price !== undefined ? { price: listing.price } : {}),
    priceType: listing.priceType,
    status: listing.status,
    allowOffers: listing.allowOffers,
    images: listing.images,
    imageUrls: imageUrls.filter((url): url is string => Boolean(url)),
    viewCount: listing.viewCount,
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    isFeatured: listing.isFeatured,
    featuredUntil: listing.featuredUntil,
    featuredLabel: listing.featuredLabel,
    featuredCreatedAt: listing.featuredCreatedAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt
  };
}

export const listActiveListings = query({
  args: {
    city: v.optional(v.string()),
    type: v.optional(listingTypeValidator),
    category: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit);
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const filtered = listings
      .filter((listing) =>
        matchesListingFilters(listing, {
          city: cleanOptional(args.city),
          type: args.type,
          category: cleanOptional(args.category),
          maxPrice: args.maxPrice
        })
      )
      .slice(0, limit);

    return await Promise.all(filtered.map((listing) => withListingPresentation(ctx, listing)));
  }
});

export const getListingById = query({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      return null;
    }

    return await withListingPresentation(ctx, listing);
  }
});

export const getPublicListingById = query({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      return null;
    }

    return await withPublicListingPresentation(ctx, listing);
  }
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const [listings, reports] = await Promise.all([
      ctx.db.query("listings").collect(),
      ctx.db.query("reports").collect()
    ]);

    return {
      active: listings.filter((listing) => listing.status === "active").length,
      resolved: listings.filter((listing) => listing.status === "resolved").length,
      removed: listings.filter((listing) => listing.status === "removed").length,
      reports: reports.filter((report) => report.status === "new").length,
      contactClicks: listings.reduce((sum, listing) => sum + listing.contactClickCount, 0)
    };
  }
});

export const listAdminListings = query({
  args: {
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit);
    const listings = await ctx.db.query("listings").collect();

    return listings.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
});

export const listMyListings = query({
  args: {
    status: v.optional(listingStatusValidator),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const limit = clampLimit(args.limit);
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
      .collect();

    const filtered = args.status
      ? listings.filter((listing) => listing.status === args.status)
      : listings;

    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);

    return await Promise.all(sorted.map((listing) => withListingPresentation(ctx, listing)));
  }
});

export const generateListingImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getOrCreateCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  }
});

export const createListing = mutation({
  args: {
    ownerId: v.optional(v.id("users")),
    type: listingTypeValidator,
    title: v.string(),
    description: v.string(),
    city: v.string(),
    category: v.string(),
    price: v.optional(v.number()),
    priceType: v.optional(priceTypeValidator),
    contactMethod: contactMethodValidator,
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactFacebookUrl: v.optional(v.string()),
    allowOffers: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    importSource: v.optional(v.union(v.literal("manual"), v.literal("facebook_text"), v.literal("facebook_url"))),
    sourceFacebookUrl: v.optional(v.string()),
    importedRawText: v.optional(v.string()),
    importParsedAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const currentUser = await getOrCreateCurrentUser(ctx);

    if (!currentUser) {
      throw new ConvexError("Authentication is required.");
    }

    if (args.price !== undefined && args.price < 0) {
      throw new ConvexError("Price cannot be negative.");
    }

    const now = Date.now();
    const title = cleanRequired(args.title, "Title", 3);
    const description = cleanRequired(args.description, "Description", 10);
    const city = cleanRequired(args.city, "City");
    const category = cleanRequired(args.category, "Category");
    const priceType = args.priceType ?? defaultPriceType(args.type, args.price);
    const needsPrice = priceType === "fixed" || priceType === "negotiable";

    if (needsPrice && args.price === undefined) {
      throw new ConvexError("Price is required for this price type.");
    }

    if ((args.images?.length ?? 0) < 1 || (args.images?.length ?? 0) > 5) {
      throw new ConvexError("Add between 1 and 5 images.");
    }

    if (args.contactMethod === "whatsapp" && !cleanOptional(args.contactPhone)) {
      throw new ConvexError("WhatsApp phone is required.");
    }

    if (args.contactMethod === "email" && !cleanOptional(args.contactEmail)) {
      throw new ConvexError("Email is required.");
    }

    if (args.contactMethod === "facebook" && !cleanOptional(args.contactFacebookUrl)) {
      throw new ConvexError("Facebook URL is required.");
    }

    const importSource = args.importSource ?? "manual";
    const sourceFacebookUrl = cleanOptional(args.sourceFacebookUrl);
    const importedRawText = scrubImportedText(args.importedRawText);

    return await ctx.db.insert("listings", {
      ownerId: currentUser._id,
      type: args.type,
      title,
      description,
      city,
      category,
      ...(args.price !== undefined ? { price: args.price } : {}),
      priceType,
      status: "active",
      contactMethod: args.contactMethod,
      ...(cleanOptional(args.contactEmail) !== undefined
        ? { contactEmail: cleanOptional(args.contactEmail) }
        : {}),
      ...(cleanOptional(args.contactPhone) !== undefined
        ? { contactPhone: cleanOptional(args.contactPhone) }
        : {}),
      ...(cleanOptional(args.contactFacebookUrl) !== undefined
        ? { contactFacebookUrl: cleanOptional(args.contactFacebookUrl) }
        : {}),
      contactVisibility: "hidden_until_click",
      allowOffers: args.allowOffers ?? priceType !== "free",
      images: args.images ?? [],
      isFeatured: false,
      viewCount: 0,
      contactClickCount: 0,
      shareCount: 0,
      saveCount: 0,
      importSource,
      ...(sourceFacebookUrl !== undefined ? { sourceFacebookUrl } : {}),
      ...(importedRawText !== undefined ? { importedRawText } : {}),
      ...(args.importParsedAt !== undefined ? { importParsedAt: args.importParsedAt } : {}),
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateListingStatus = mutation({
  args: {
    id: v.id("listings"),
    status: listingStatusValidator,
    removedReason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const currentUser = await getOrCreateCurrentUser(ctx);
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    if (listing.ownerId !== currentUser?._id && currentUser?.role !== "admin") {
      throw new ConvexError("You can update only your own listings.");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
      ...(args.status === "resolved" ? { resolvedAt: now } : {}),
      ...(args.status === "removed"
        ? { removedReason: cleanOptional(args.removedReason) ?? "Removed by admin" }
        : {})
    });

    return args.id;
  }
});

export const adminSetListingFeatured = mutation({
  args: {
    id: v.id("listings"),
    isFeatured: v.boolean(),
    featuredUntil: v.optional(v.number()),
    featuredLabel: v.optional(featuredLabelValidator)
  },
  handler: async (ctx, args) => {
    const currentUser = await getOrCreateCurrentUser(ctx);

    if (currentUser?.role !== "admin") {
      throw new ConvexError("Admin access is required.");
    }

    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      isFeatured: args.isFeatured,
      ...(args.isFeatured
        ? {
            ...(args.featuredUntil !== undefined ? { featuredUntil: args.featuredUntil } : {}),
            featuredLabel: args.featuredLabel ?? "Istaknuto",
            featuredCreatedAt: listing.featuredCreatedAt ?? now
          }
        : {}),
      updatedAt: now
    });

    return args.id;
  }
});

export const incrementShareCount = mutation({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    await ctx.db.patch(args.id, {
      shareCount: listing.shareCount + 1,
      updatedAt: Date.now()
    });

    return listing.shareCount + 1;
  }
});

export const incrementSaveCount = mutation({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    await ctx.db.patch(args.id, {
      saveCount: listing.saveCount + 1,
      updatedAt: Date.now()
    });

    return listing.saveCount + 1;
  }
});

export const incrementViewCount = mutation({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    await ctx.db.patch(args.id, {
      viewCount: listing.viewCount + 1,
      updatedAt: Date.now()
    });

    return listing.viewCount + 1;
  }
});

export const createReport = mutation({
  args: {
    listingId: v.id("listings"),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    const reporter = await getReporterUser(ctx);
    const reason = cleanRequired(args.reason, "Reason", 2);

    return await ctx.db.insert("reports", {
      listingId: args.listingId,
      ...(reporter ? { reporterUserId: reporter._id } : {}),
      reason,
      status: "new",
      createdAt: Date.now()
    });
  }
});
