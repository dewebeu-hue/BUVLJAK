import { ConvexError } from "convex/values";
import { mutation } from "./_generated/server";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
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

      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId,
      displayName,
      ...(email !== undefined ? { email } : {}),
      ...(city !== undefined ? { city } : {}),
      createdAt: now,
      updatedAt: now,
      role: "user",
      plan: "free"
    });
  }
});
