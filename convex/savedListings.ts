import { ConvexError, v } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { mutation, query } from "./_generated/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { isAdminEmail } from "./adminAuth";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function logSavedListingDebug(
  message: string,
  payload: { listingId?: Id<"listings">; userId?: Id<"users">; email?: string; storage?: string }
) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[savedListings] ${message}`, {
      ...payload,
      email: payload.email ?? null
    });
  }
}

async function getOrCreateCurrentUser(ctx: GenericMutationCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Za spremanje oglasa moraš biti prijavljen/a.");
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
  const shouldBeAdmin = isAdminEmail(email);

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
      ...(shouldBeAdmin && existing.role !== "admin" ? { role: "admin" } : {}),
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
    role: shouldBeAdmin ? "admin" : "user",
    plan: "free"
  });

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new ConvexError("User profile could not be created.");
  }

  return user;
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

async function getSavedListing(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  userId: Id<"users">,
  listingId: Id<"listings">
) {
  return await ctx.db
    .query("savedListings")
    .withIndex("by_userId_and_listingId", (q) =>
      q.eq("userId", userId).eq("listingId", listingId)
    )
    .first();
}

async function listingPayload(
  ctx: GenericQueryCtx<DataModel>,
  listing: Doc<"listings">,
  currentUser: Doc<"users">
) {
  const [owner, imageUrls] = await Promise.all([
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
    ...listing,
    imageUrls: imageUrls.filter((url): url is string => Boolean(url)),
    ownerDisplayName: owner?.displayName,
    isOwner: listing.ownerId === currentUser._id
  };
}

export const isListingSaved = query({
  args: {
    listingId: v.id("listings")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return false;
    }

    const savedListing = await getSavedListing(ctx, user._id, args.listingId);
    return Boolean(savedListing);
  }
});

export const listMySavedListings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    logSavedListingDebug("list query", {
      userId: user._id,
      email: user.email,
      storage: "savedListings"
    });

    const savedListings = await ctx.db
      .query("savedListings")
      .withIndex("by_userId_and_savedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const hydrated = await Promise.all(
      savedListings.map(async (savedListing) => {
        const listing = await ctx.db.get(savedListing.listingId);

        if (!listing || listing.status === "removed") {
          return null;
        }

        return {
          id: savedListing._id,
          savedAt: savedListing.savedAt,
          listing: await listingPayload(ctx, listing, user)
        };
      })
    );

    return hydrated.filter(
      (item): item is NonNullable<(typeof hydrated)[number]> => item !== null
    );
  }
});

export const saveListing = mutation({
  args: {
    listingId: v.id("listings")
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateCurrentUser(ctx);
    const listing = await ctx.db.get(args.listingId);

    logSavedListingDebug("save request", {
      listingId: args.listingId,
      userId: user._id,
      email: user.email,
      storage: "savedListings"
    });

    if (!listing || listing.status === "removed") {
      throw new ConvexError("Oglas nije pronađen ili više nije dostupan.");
    }

    const existing = await getSavedListing(ctx, user._id, args.listingId);

    if (existing) {
      return {
        saved: true,
        saveCount: listing.saveCount
      };
    }

    const now = Date.now();

    await ctx.db.insert("savedListings", {
      userId: user._id,
      listingId: args.listingId,
      createdAt: now,
      savedAt: now
    });

    const saveCount = listing.saveCount + 1;

    await ctx.db.patch(args.listingId, {
      saveCount,
      updatedAt: now
    });

    return {
      saved: true,
      saveCount
    };
  }
});

export const unsaveListing = mutation({
  args: {
    listingId: v.id("listings")
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateCurrentUser(ctx);
    const listing = await ctx.db.get(args.listingId);

    logSavedListingDebug("unsave request", {
      listingId: args.listingId,
      userId: user._id,
      email: user.email,
      storage: "savedListings"
    });

    if (!listing) {
      throw new ConvexError("Oglas nije pronađen.");
    }

    const existing = await getSavedListing(ctx, user._id, args.listingId);

    if (!existing) {
      return {
        saved: false,
        saveCount: listing.saveCount
      };
    }

    await ctx.db.delete(existing._id);

    const now = Date.now();
    const saveCount = Math.max(0, listing.saveCount - 1);

    await ctx.db.patch(args.listingId, {
      saveCount,
      updatedAt: now
    });

    return {
      saved: false,
      saveCount
    };
  }
});
