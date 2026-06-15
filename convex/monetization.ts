import { ConvexError, v } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { mutation, query } from "./_generated/server";
import type { DataModel, Doc } from "./_generated/dataModel";
import { sponsorPlacementValidator } from "./validators";
import { requireAdmin as requireAdminAccess } from "./adminAuth";

const DEFAULT_MONETIZATION_SETTINGS = {
  localSponsorsEnabled: false,
  featuredListingsEnabled: false,
  pricingPageVisible: false,
  proPlansEnabled: false,
  paymentsEnabled: false
};

type ConvexCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

function cleanOptional(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function cleanRequired(value: string, fieldName: string) {
  const cleaned = cleanOptional(value);

  if (!cleaned) {
    throw new ConvexError(`${fieldName} is required.`);
  }

  return cleaned;
}

async function getLatestSettingsDoc(ctx: ConvexCtx) {
  const [settings] = await ctx.db
    .query("monetizationSettings")
    .withIndex("by_updatedAt")
    .order("desc")
    .take(1);

  return settings ?? null;
}

function withDefaults(settings: Doc<"monetizationSettings"> | null) {
  return {
    ...DEFAULT_MONETIZATION_SETTINGS,
    ...(settings
      ? {
          localSponsorsEnabled: settings.localSponsorsEnabled,
          featuredListingsEnabled: settings.featuredListingsEnabled,
          pricingPageVisible: settings.pricingPageVisible ?? false,
          proPlansEnabled: settings.proPlansEnabled,
          paymentsEnabled: settings.paymentsEnabled,
          updatedAt: settings.updatedAt
        }
      : {})
  };
}

async function requireAdmin(ctx: ConvexCtx) {
  const status = await requireAdminAccess(ctx);
  return status.user;
}

function isVisibleNow(sponsor: Doc<"localSponsors">, now: number) {
  if (!sponsor.isActive) {
    return false;
  }

  if (sponsor.startsAt !== undefined && sponsor.startsAt > now) {
    return false;
  }

  if (sponsor.endsAt !== undefined && sponsor.endsAt < now) {
    return false;
  }

  return true;
}

function publicSponsorPayload(sponsor: Doc<"localSponsors">) {
  return {
    id: sponsor._id,
    name: sponsor.name,
    headline: sponsor.headline,
    body: sponsor.body,
    city: sponsor.city,
    category: sponsor.category,
    href: sponsor.href,
    imageUrl: sponsor.imageUrl,
    placement: sponsor.placement
  };
}

export const getMonetizationSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await getLatestSettingsDoc(ctx);
    return withDefaults(settings);
  }
});

export const updateMonetizationSettings = mutation({
  args: {
    localSponsorsEnabled: v.optional(v.boolean()),
    featuredListingsEnabled: v.optional(v.boolean()),
    pricingPageVisible: v.optional(v.boolean()),
    proPlansEnabled: v.optional(v.boolean()),
    paymentsEnabled: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const settings = await getLatestSettingsDoc(ctx);
    const current = withDefaults(settings);
    const now = Date.now();
    const next = {
      localSponsorsEnabled: args.localSponsorsEnabled ?? current.localSponsorsEnabled,
      featuredListingsEnabled: args.featuredListingsEnabled ?? current.featuredListingsEnabled,
      pricingPageVisible: args.pricingPageVisible ?? current.pricingPageVisible,
      proPlansEnabled: args.proPlansEnabled ?? current.proPlansEnabled,
      paymentsEnabled: args.paymentsEnabled ?? current.paymentsEnabled,
      updatedAt: now
    };

    if (settings) {
      await ctx.db.patch(settings._id, {
        ...next,
        ...(admin ? { updatedBy: admin._id } : {})
      });
    } else {
      await ctx.db.insert("monetizationSettings", {
        ...next,
        createdAt: now,
        ...(admin ? { updatedBy: admin._id } : {})
      });
    }

    return next;
  }
});

export const createLocalSponsor = mutation({
  args: {
    name: v.string(),
    headline: v.string(),
    body: v.optional(v.string()),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    href: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    placement: sponsorPlacementValidator,
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.startsAt !== undefined && args.endsAt !== undefined && args.endsAt < args.startsAt) {
      throw new ConvexError("Sponsor end date must be after the start date.");
    }

    const now = Date.now();

    return await ctx.db.insert("localSponsors", {
      name: cleanRequired(args.name, "Sponsor name"),
      headline: cleanRequired(args.headline, "Sponsor headline"),
      ...(cleanOptional(args.body) ? { body: cleanOptional(args.body) } : {}),
      ...(cleanOptional(args.city) ? { city: cleanOptional(args.city) } : {}),
      ...(cleanOptional(args.category) ? { category: cleanOptional(args.category) } : {}),
      ...(cleanOptional(args.href) ? { href: cleanOptional(args.href) } : {}),
      ...(cleanOptional(args.imageUrl) ? { imageUrl: cleanOptional(args.imageUrl) } : {}),
      placement: args.placement,
      isActive: args.isActive ?? false,
      ...(args.startsAt !== undefined ? { startsAt: args.startsAt } : {}),
      ...(args.endsAt !== undefined ? { endsAt: args.endsAt } : {}),
      createdAt: now,
      updatedAt: now,
      ...(admin ? { createdBy: admin._id } : {})
    });
  }
});

export const updateLocalSponsor = mutation({
  args: {
    id: v.id("localSponsors"),
    name: v.optional(v.string()),
    headline: v.optional(v.string()),
    body: v.optional(v.string()),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    href: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    placement: v.optional(sponsorPlacementValidator),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const sponsor = await ctx.db.get(args.id);

    if (!sponsor) {
      throw new ConvexError("Sponsor not found.");
    }

    const startsAt = args.startsAt ?? sponsor.startsAt;
    const endsAt = args.endsAt ?? sponsor.endsAt;

    if (startsAt !== undefined && endsAt !== undefined && endsAt < startsAt) {
      throw new ConvexError("Sponsor end date must be after the start date.");
    }

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined ? { name: cleanRequired(args.name, "Sponsor name") } : {}),
      ...(args.headline !== undefined
        ? { headline: cleanRequired(args.headline, "Sponsor headline") }
        : {}),
      ...(cleanOptional(args.body) ? { body: cleanOptional(args.body) } : {}),
      ...(cleanOptional(args.city) ? { city: cleanOptional(args.city) } : {}),
      ...(cleanOptional(args.category) ? { category: cleanOptional(args.category) } : {}),
      ...(cleanOptional(args.href) ? { href: cleanOptional(args.href) } : {}),
      ...(cleanOptional(args.imageUrl) ? { imageUrl: cleanOptional(args.imageUrl) } : {}),
      ...(args.placement !== undefined ? { placement: args.placement } : {}),
      ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
      ...(args.startsAt !== undefined ? { startsAt: args.startsAt } : {}),
      ...(args.endsAt !== undefined ? { endsAt: args.endsAt } : {}),
      updatedAt: Date.now()
    });

    return args.id;
  }
});

export const listLocalSponsorsAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const sponsors = await ctx.db.query("localSponsors").collect();
    return sponsors.sort((a, b) => b.updatedAt - a.updatedAt);
  }
});

export const listVisibleLocalSponsors = query({
  args: {
    placement: v.optional(sponsorPlacementValidator),
    city: v.optional(v.string()),
    category: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const settings = await getLatestSettingsDoc(ctx);

    if (!withDefaults(settings).localSponsorsEnabled) {
      return [];
    }

    const now = Date.now();
    const city = cleanOptional(args.city);
    const category = cleanOptional(args.category);
    const sponsors = await ctx.db
      .query("localSponsors")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return sponsors
      .filter((sponsor) => {
        if (!isVisibleNow(sponsor, now)) {
          return false;
        }

        if (args.placement && sponsor.placement !== args.placement) {
          return false;
        }

        if (city && sponsor.city && sponsor.city !== city) {
          return false;
        }

        if (category && sponsor.category && sponsor.category !== category) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .map(publicSponsorPayload);
  }
});
