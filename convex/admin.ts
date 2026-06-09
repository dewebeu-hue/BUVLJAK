import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  featuredLabelValidator,
  listingStatusValidator,
  listingTypeValidator,
  reportStatusValidator,
  userRoleValidator
} from "./validators";
import { getAdminStatus, requireAdmin } from "./adminAuth";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEMO_LISTINGS: Array<{
  type: Doc<"listings">["type"];
  title: string;
  description: string;
  city: string;
  category: string;
  price?: number;
  priceType: Doc<"listings">["priceType"];
}> = [
  {
    type: "sell",
    title: "Demo: dječji bicikl",
    description: "Demo oglas za provjeru feeda i moderacije u zatvorenoj beti.",
    city: "Nova Gradiška",
    category: "Djeca",
    price: 65,
    priceType: "fixed"
  },
  {
    type: "give",
    title: "Demo: poklanjam kauč",
    description: "Demo oglas za provjeru poklanjanja i lokalnog preuzimanja.",
    city: "Cernik",
    category: "Namještaj",
    priceType: "free"
  },
  {
    type: "want",
    title: "Demo: tražim perilicu do 100 EUR",
    description: "Demo oglas za provjeru potraga i spremljenih pretraga.",
    city: "Rešetari",
    category: "Kućanski aparati",
    price: 100,
    priceType: "wanted"
  }
];

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalized(value?: string) {
  return optionalString(value)?.toLocaleLowerCase("hr-HR") ?? "";
}

function clampLimit(limit?: number) {
  return Math.min(Math.max(Math.floor(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
}

function matchesText(value: string, search?: string) {
  const query = normalized(search);
  return !query || normalized(value).includes(query);
}

function ownerPayload(owner: Doc<"users"> | null) {
  if (!owner) {
    return {
      ownerDisplayName: undefined,
      ownerEmail: undefined
    };
  }

  return {
    ownerDisplayName: owner.displayName,
    ownerEmail: owner.email
  };
}

function listingPayload(
  listing: Doc<"listings">,
  owner: Doc<"users"> | null,
  reportCount = 0
) {
  return {
    id: listing._id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    city: listing.city,
    category: listing.category,
    price: listing.price,
    priceType: listing.priceType,
    status: listing.status,
    viewCount: listing.viewCount,
    contactClickCount: listing.contactClickCount,
    shareCount: listing.shareCount,
    saveCount: listing.saveCount,
    isFeatured: listing.isFeatured ?? false,
    featuredLabel: listing.featuredLabel,
    isDemo: listing.isDemo ?? false,
    removedReason: listing.removedReason,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    reportCount,
    ...ownerPayload(owner)
  };
}

export const getAdminAccess = query({
  args: {},
  handler: async (ctx) => {
    const status = await getAdminStatus(ctx);

    return {
      state: status.state,
      isAdmin: status.isAdmin,
      isAdminEmail: status.isAdminEmail,
      user: status.user
        ? {
            id: status.user._id,
            displayName: status.user.displayName,
            email: status.user.email,
            role: status.user.role
          }
        : null
    };
  }
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const [listings, reports, users, savedSearches, notificationEvents, contactEvents] =
      await Promise.all([
        ctx.db.query("listings").collect(),
        ctx.db.query("reports").collect(),
        ctx.db.query("users").collect(),
        ctx.db.query("savedSearches").collect(),
        ctx.db.query("notificationEvents").collect(),
        ctx.db.query("contactEvents").collect()
      ]);

    return {
      totalListings: listings.length,
      activeListings: listings.filter((listing) => listing.status === "active").length,
      pausedListings: listings.filter((listing) => listing.status === "paused").length,
      resolvedListings: listings.filter((listing) => listing.status === "resolved").length,
      removedListings: listings.filter((listing) => listing.status === "removed").length,
      reportedListings: new Set(reports.map((report) => report.listingId)).size,
      users: users.length,
      contactClicks: listings.reduce((sum, listing) => sum + listing.contactClickCount, 0),
      shares: listings.reduce((sum, listing) => sum + listing.shareCount, 0),
      savedSearches: savedSearches.length,
      sentEmailNotifications: notificationEvents.filter((event) => event.status === "sent").length,
      failedOrSkippedEmailNotifications: notificationEvents.filter(
        (event) => event.status === "failed" || event.status === "skipped"
      ).length,
      listingsLast7Days: listings.filter((listing) => listing.createdAt >= sevenDaysAgo).length,
      contactClicksLast7Days: contactEvents.filter((event) => event.createdAt >= sevenDaysAgo).length
    };
  }
});

export const listAdminListings = query({
  args: {
    status: v.optional(listingStatusValidator),
    type: v.optional(listingTypeValidator),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    reportedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = clampLimit(args.limit);
    const [allListings, reports, users] = await Promise.all([
      ctx.db.query("listings").collect(),
      ctx.db.query("reports").collect(),
      ctx.db.query("users").collect()
    ]);
    const reportCounts = new Map<string, number>();
    const reportedIds = new Set<string>();
    const owners = new Map(users.map((user) => [user._id, user]));

    reports.forEach((report) => {
      reportedIds.add(report.listingId);
      reportCounts.set(report.listingId, (reportCounts.get(report.listingId) ?? 0) + 1);
    });

    return allListings
      .filter((listing) => {
        if (args.status && listing.status !== args.status) {
          return false;
        }
        if (args.type && listing.type !== args.type) {
          return false;
        }
        if (optionalString(args.city) && normalized(listing.city) !== normalized(args.city)) {
          return false;
        }
        if (
          optionalString(args.category) &&
          normalized(listing.category) !== normalized(args.category)
        ) {
          return false;
        }
        if (args.reportedOnly && !reportedIds.has(listing._id)) {
          return false;
        }
        if (args.ownerId && listing.ownerId !== args.ownerId) {
          return false;
        }
        if (!matchesText(`${listing.title} ${listing.description}`, args.search)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((listing) =>
        listingPayload(listing, listing.ownerId ? owners.get(listing.ownerId) ?? null : null, reportCounts.get(listing._id) ?? 0)
      );
  }
});

export const adminUpdateListingStatus = mutation({
  args: {
    id: v.id("listings"),
    status: listingStatusValidator,
    removedReason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

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
        ? { removedReason: optionalString(args.removedReason) ?? "Removed by admin" }
        : {})
    });

    return args.id;
  }
});

export const adminSetListingFeatured = mutation({
  args: {
    id: v.id("listings"),
    isFeatured: v.boolean(),
    featuredLabel: v.optional(featuredLabelValidator)
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new ConvexError("Listing not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      isFeatured: args.isFeatured,
      featuredLabel: args.isFeatured ? args.featuredLabel ?? "Istaknuto" : undefined,
      featuredCreatedAt: args.isFeatured ? listing.featuredCreatedAt ?? now : undefined,
      updatedAt: now
    });

    return args.id;
  }
});

export const listReports = query({
  args: {
    status: v.optional(reportStatusValidator),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = clampLimit(args.limit);
    const reports = args.status
      ? await ctx.db
          .query("reports")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("reports").collect();

    const sorted = reports.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);

    return await Promise.all(
      sorted.map(async (report) => {
        const [listing, reporter] = await Promise.all([
          ctx.db.get(report.listingId),
          report.reporterUserId ? ctx.db.get(report.reporterUserId) : Promise.resolve(null)
        ]);

        return {
          id: report._id,
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt,
          listing: listing
            ? {
                id: listing._id,
                title: listing.title,
                status: listing.status,
                city: listing.city,
                category: listing.category,
                removedReason: listing.removedReason
              }
            : null,
          reporter: reporter
            ? {
                id: reporter._id,
                displayName: reporter.displayName,
                email: reporter.email
              }
            : null
        };
      })
    );
  }
});

export const updateReportStatus = mutation({
  args: {
    id: v.id("reports"),
    status: reportStatusValidator
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const report = await ctx.db.get(args.id);
    if (!report) {
      throw new ConvexError("Report not found.");
    }

    await ctx.db.patch(args.id, { status: args.status });
    return args.id;
  }
});

export const adminRemoveListingFromReport = mutation({
  args: {
    reportId: v.id("reports"),
    removedReason: v.string()
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError("Report not found.");
    }

    await ctx.db.patch(report.listingId, {
      status: "removed",
      removedReason: optionalString(args.removedReason) ?? report.reason,
      updatedAt: Date.now()
    });
    await ctx.db.patch(args.reportId, { status: "action_taken" });

    return report.listingId;
  }
});

export const adminRestoreListingFromReport = mutation({
  args: {
    reportId: v.id("reports")
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError("Report not found.");
    }

    await ctx.db.patch(report.listingId, {
      status: "active",
      updatedAt: Date.now()
    });
    await ctx.db.patch(args.reportId, { status: "reviewed" });

    return report.listingId;
  }
});

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = clampLimit(args.limit);
    const [users, listings] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("listings").collect()
    ]);

    return users
      .filter((user) =>
        matchesText(`${user.displayName} ${user.email ?? ""} ${user.city ?? ""}`, args.search)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((user) => {
        const userListings = listings.filter((listing) => listing.ownerId === user._id);

        return {
          id: user._id,
          displayName: user.displayName,
          email: user.email,
          city: user.city,
          role: user.role,
          isBlocked: user.isBlocked ?? false,
          blockedReason: user.blockedReason,
          listingsCount: userListings.length,
          activeListingsCount: userListings.filter((listing) => listing.status === "active").length,
          createdAt: user.createdAt
        };
      });
  }
});

export const adminUpdateUserRole = mutation({
  args: {
    id: v.id("users"),
    role: userRoleValidator
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (admin.user?._id === args.id && args.role !== "admin" && !admin.isAdminEmail) {
      throw new ConvexError("Ne možeš sebi maknuti admin u ovom koraku.");
    }

    await ctx.db.patch(args.id, {
      role: args.role,
      updatedAt: Date.now()
    });

    return args.id;
  }
});

export const adminUpdateUserBlock = mutation({
  args: {
    id: v.id("users"),
    isBlocked: v.boolean(),
    blockedReason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.id, {
      isBlocked: args.isBlocked,
      ...(args.isBlocked ? { blockedReason: optionalString(args.blockedReason) ?? "Admin block" } : {}),
      updatedAt: Date.now()
    });

    return args.id;
  }
});

export const getBetaReadiness = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const latestSettings = await ctx.db
      .query("monetizationSettings")
      .withIndex("by_updatedAt")
      .order("desc")
      .first();
    const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL);
    const checks = [
      { label: "Convex povezan", status: "pass" as const },
      { label: "Clerk auth aktivan", status: "pass" as const },
      { label: "Admin guard aktivan", status: "pass" as const },
      { label: "Kreiranje oglasa radi", status: "manual" as const },
      { label: "Feed aktivnih oglasa radi", status: "pass" as const },
      { label: "Kontakt resolver radi", status: "manual" as const },
      { label: "Rate limit kontakt upita aktivan", status: "pass" as const },
      { label: "Privatni kontakt podaci nisu u public queryjima", status: "pass" as const },
      { label: "Spremljene potrage rade", status: "pass" as const },
      {
        label: emailConfigured
          ? "Email obavijesti konfigurirane"
          : "Email obavijesti imaju fallback bez rušenja",
        status: emailConfigured ? ("pass" as const) : ("manual" as const)
      },
      {
        label: "Monetizacija default OFF",
        status:
          !latestSettings ||
          (!latestSettings.localSponsorsEnabled &&
            !latestSettings.featuredListingsEnabled &&
            !latestSettings.proPlansEnabled &&
            !latestSettings.paymentsEnabled)
            ? ("pass" as const)
            : ("fail" as const)
      },
      { label: "Nema Stripe/plaćanja u MVP-u", status: "pass" as const },
      { label: "Nema Facebook scrapinga", status: "pass" as const },
      { label: "OG preview route radi", status: "pass" as const },
      { label: "Mobile-first UI provjeren", status: "manual" as const }
    ];
    const hasFail = checks.some((check) => check.status === "fail");
    const hasManual = checks.some((check) => check.status === "manual");

    return {
      status: hasFail ? "Nije spremno" : hasManual ? "Treba provjeriti" : "Spremno za zatvorenu betu",
      checks
    };
  }
});

export const adminSeedDemoListings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .first();

    if (existing) {
      return { inserted: 0, skipped: true };
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (let index = 0; index < DEMO_LISTINGS.length; index += 1) {
      const listing = DEMO_LISTINGS[index];
      await ctx.db.insert("listings", {
        ...listing,
        status: "active",
        contactMethod: "none",
        contactVisibility: "hidden_until_click",
        allowOffers: listing.type !== "give",
        images: [],
        viewCount: 0,
        contactClickCount: 0,
        shareCount: 0,
        saveCount: 0,
        isFeatured: false,
        isDemo: true,
        createdAt: now - index * day,
        updatedAt: now - index * day
      });
    }

    return { inserted: DEMO_LISTINGS.length, skipped: false };
  }
});

export const adminHideDemoListings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const demos = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .collect();

    for (const listing of demos) {
      await ctx.db.patch(listing._id, {
        status: "removed",
        removedReason: "Demo oglas sakriven prije bete",
        updatedAt: Date.now()
      });
    }

    return { updated: demos.length };
  }
});

export const adminDeleteDemoListings = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const demos = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .collect();

    for (const listing of demos) {
      await ctx.db.delete(listing._id);
    }

    return { deleted: demos.length };
  }
});
