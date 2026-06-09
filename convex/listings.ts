import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  contactMethodValidator,
  listingStatusValidator,
  listingTypeValidator,
  priceTypeValidator
} from "./validators";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

    return listings
      .filter((listing) =>
        matchesListingFilters(listing, {
          city: cleanOptional(args.city),
          type: args.type,
          category: cleanOptional(args.category),
          maxPrice: args.maxPrice
        })
      )
      .slice(0, limit);
  }
});

export const getListingById = query({
  args: {
    id: v.id("listings")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
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
    images: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    if (args.price !== undefined && args.price < 0) {
      throw new ConvexError("Price cannot be negative.");
    }

    const now = Date.now();
    const title = cleanRequired(args.title, "Title");
    const description = cleanRequired(args.description, "Description", 8);
    const city = cleanRequired(args.city, "City");
    const category = cleanRequired(args.category, "Category");
    const priceType = args.priceType ?? defaultPriceType(args.type, args.price);

    return await ctx.db.insert("listings", {
      ...(args.ownerId !== undefined ? { ownerId: args.ownerId } : {}),
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
      viewCount: 0,
      contactClickCount: 0,
      shareCount: 0,
      saveCount: 0,
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
    const listing = await ctx.db.get(args.id);

    if (!listing) {
      throw new ConvexError("Listing not found.");
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
