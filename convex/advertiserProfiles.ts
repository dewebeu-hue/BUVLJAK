import { ConvexError, v } from "convex/values";

import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { advertiserAccountTypeValidator } from "./validators";

type AdvertiserProfileShape = Partial<
  Pick<
    Doc<"advertiserProfiles">,
    | "firstName"
    | "lastName"
    | "oib"
    | "country"
    | "street"
    | "houseNumber"
    | "postalCode"
    | "city"
    | "county"
    | "phone"
  >
>;

const profileInputValidator = {
  accountType: v.optional(advertiserAccountTypeValidator),
  firstName: v.string(),
  lastName: v.string(),
  oib: v.string(),
  country: v.string(),
  street: v.string(),
  houseNumber: v.string(),
  postalCode: v.string(),
  city: v.string(),
  county: v.string(),
  phone: v.string(),
  publicCityEnabled: v.boolean(),
  publicPhoneEnabled: v.boolean(),
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeOib = (value: string) => value.replace(/\D/g, "");

function isValidOib(value: string) {
  const oib = normalizeOib(value);

  if (!/^\d{11}$/.test(oib)) {
    return false;
  }

  let remainder = 10;

  for (let index = 0; index < 10; index += 1) {
    remainder += Number(oib[index]);
    remainder %= 10;

    if (remainder === 0) {
      remainder = 10;
    }

    remainder *= 2;
    remainder %= 11;
  }

  const controlDigit = 11 - remainder;
  const expectedDigit = controlDigit === 10 ? 0 : controlDigit;

  return expectedDigit === Number(oib[10]);
}

export function getAdvertiserProfileMissingFields(profile: AdvertiserProfileShape | null | undefined) {
  const missingFields: string[] = [];

  if (!profile) {
    return [
      "ime",
      "prezime",
      "OIB",
      "država",
      "ulica",
      "kućni broj",
      "poštanski broj",
      "mjesto",
      "županija",
      "telefon",
    ];
  }

  if (!profile.firstName?.trim()) missingFields.push("ime");
  if (!profile.lastName?.trim()) missingFields.push("prezime");
  if (!profile.oib?.trim() || !isValidOib(profile.oib)) missingFields.push("OIB");
  if (!profile.country?.trim()) missingFields.push("država");
  if (!profile.street?.trim()) missingFields.push("ulica");
  if (!profile.houseNumber?.trim()) missingFields.push("kućni broj");
  if (!profile.postalCode?.trim()) missingFields.push("poštanski broj");
  if (!profile.city?.trim()) missingFields.push("mjesto");
  if (!profile.county?.trim()) missingFields.push("županija");
  if (!profile.phone?.trim()) missingFields.push("telefon");

  return missingFields;
}

export function isAdvertiserProfileComplete(profile: Doc<"advertiserProfiles"> | null | undefined) {
  return Boolean(profile?.completedAt && getAdvertiserProfileMissingFields(profile).length === 0);
}

async function requireCurrentUserId(ctx: { auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Prijavi se kako bi uredio Podatke za predaju oglasa.");
  }

  return identity.tokenIdentifier;
}

export const getMyAdvertiserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireCurrentUserId(ctx);

    return await ctx.db
      .query("advertiserProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getMyAdvertiserProfileStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireCurrentUserId(ctx);
    const profile = await ctx.db
      .query("advertiserProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const missingFields = getAdvertiserProfileMissingFields(profile);

    return {
      isComplete: isAdvertiserProfileComplete(profile),
      missingFields,
      completedAt: profile?.completedAt,
      updatedAt: profile?.updatedAt,
      publicCityEnabled: profile?.publicCityEnabled ?? false,
      publicPhoneEnabled: profile?.publicPhoneEnabled ?? false,
    };
  },
});

export const upsertMyAdvertiserProfile = mutation({
  args: profileInputValidator,
  handler: async (ctx, args) => {
    const userId = await requireCurrentUserId(ctx);
    const now = Date.now();

    const normalized = {
      accountType: args.accountType ?? "individual",
      firstName: normalizeText(args.firstName),
      lastName: normalizeText(args.lastName),
      oib: normalizeOib(args.oib),
      country: normalizeText(args.country),
      street: normalizeText(args.street),
      houseNumber: normalizeText(args.houseNumber),
      postalCode: normalizeText(args.postalCode),
      city: normalizeText(args.city),
      county: normalizeText(args.county),
      phone: normalizeText(args.phone),
      publicCityEnabled: args.publicCityEnabled,
      publicPhoneEnabled: args.publicPhoneEnabled,
    };

    const missingFields = getAdvertiserProfileMissingFields(normalized);

    if (missingFields.length > 0) {
      throw new ConvexError(`Dopuni ili provjeri: ${missingFields.join(", ")}.`);
    }

    const existing = await ctx.db
      .query("advertiserProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const completedAt = existing?.completedAt ?? now;

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...normalized,
        completedAt,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("advertiserProfiles", {
        userId,
        ...normalized,
        completedAt,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      isComplete: true,
      missingFields: [],
      completedAt,
      updatedAt: now,
    };
  },
});
