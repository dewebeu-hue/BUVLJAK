import { ConvexError } from "convex/values";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel, Doc } from "./_generated/dataModel";

type ConvexCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedEmail(value?: string) {
  return optionalString(value)?.toLocaleLowerCase("hr-HR");
}

export function isAdminEmail(email?: string) {
  const currentEmail = normalizedEmail(email);

  if (!currentEmail) {
    return false;
  }

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => normalizedEmail(item))
    .filter(Boolean)
    .includes(currentEmail);
}

export async function getAdminStatus(ctx: ConvexCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return {
      state: "signedOut" as const,
      isAdmin: false,
      isAdminEmail: false,
      user: null as Doc<"users"> | null,
      email: undefined as string | undefined
    };
  }

  const email = optionalString(identity.email);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", identity.subject))
    .first();
  const adminEmail = isAdminEmail(email);
  const isAdmin = user?.role === "admin" || adminEmail;

  return {
    state: isAdmin ? ("admin" as const) : ("forbidden" as const),
    isAdmin,
    isAdminEmail: adminEmail,
    user,
    email
  };
}

export async function requireAdmin(ctx: ConvexCtx) {
  const status = await getAdminStatus(ctx);

  if (!status.isAdmin) {
    throw new ConvexError("Admin access is required.");
  }

  return status;
}
