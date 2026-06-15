import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { DataModel, Doc } from "./_generated/dataModel";
import { requireAdmin as requireAdminAccess } from "./adminAuth";

const DEFAULT_FEATURE_FLAGS = {
  servicesEnabled: false
};

type ConvexCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

async function getLatestFeatureFlagsDoc(ctx: ConvexCtx) {
  const [featureFlags] = await ctx.db
    .query("featureFlags")
    .withIndex("by_updatedAt")
    .order("desc")
    .take(1);

  return featureFlags ?? null;
}

function withDefaults(featureFlags: Doc<"featureFlags"> | null) {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...(featureFlags
      ? {
          servicesEnabled: featureFlags.servicesEnabled,
          updatedAt: featureFlags.updatedAt
        }
      : {})
  };
}

export const getPublicFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const featureFlags = await getLatestFeatureFlagsDoc(ctx);

    return {
      servicesEnabled: withDefaults(featureFlags).servicesEnabled
    };
  }
});

export const getAdminFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    await requireAdminAccess(ctx);

    const featureFlags = await getLatestFeatureFlagsDoc(ctx);
    return withDefaults(featureFlags);
  }
});

export const adminSetServicesEnabled = mutation({
  args: {
    enabled: v.boolean()
  },
  handler: async (ctx, args) => {
    const admin = await requireAdminAccess(ctx);
    const featureFlags = await getLatestFeatureFlagsDoc(ctx);
    const now = Date.now();

    if (featureFlags) {
      await ctx.db.patch(featureFlags._id, {
        servicesEnabled: args.enabled,
        updatedAt: now,
        ...(admin.user ? { updatedBy: admin.user._id } : {})
      });
    } else {
      await ctx.db.insert("featureFlags", {
        servicesEnabled: args.enabled,
        createdAt: now,
        updatedAt: now,
        ...(admin.user ? { updatedBy: admin.user._id } : {})
      });
    }

    return {
      servicesEnabled: args.enabled,
      updatedAt: now
    };
  }
});
