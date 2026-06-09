import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { contactMethodValidator, contactSourceValidator } from "./validators";
import { getPublicListingUrl } from "../lib/public-urls";

const contactIntentValidator = v.union(
  v.literal("contact"),
  v.literal("availability"),
  v.literal("offer"),
  v.literal("pickup"),
  v.literal("swap"),
  v.literal("have_item")
);

const rateLimitActionValidator = v.union(
  v.literal("contact"),
  v.literal("email"),
  v.literal("offer")
);

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizePhoneForWhatsApp(value?: string) {
  const cleaned = value?.replace(/[^\d+]/g, "").trim();

  if (!cleaned) {
    return undefined;
  }

  const withoutPlus = cleaned.replace(/^\+/, "");

  if (withoutPlus.startsWith("00")) {
    return withoutPlus.slice(2);
  }

  if (withoutPlus.startsWith("0")) {
    return `385${withoutPlus.slice(1)}`;
  }

  return withoutPlus;
}

function actionForRequest(method: string, intent?: string) {
  if (intent === "offer" || intent === "swap" || intent === "have_item") {
    return "offer";
  }

  if (method === "email") {
    return "email";
  }

  return "contact";
}

function buildContactMessage({
  title,
  type,
  intent,
  offerAmount,
  message
}: {
  title: string;
  type: string;
  intent?: string;
  offerAmount?: number;
  message?: string;
}) {
  const cleanMessage = optionalString(message);

  if (intent === "offer" && typeof offerAmount === "number") {
    return `Pozdrav, vidio/la sam oglas "${title}" na Buvljaku. Nudim ${offerAmount} EUR. Je li prihvatljivo?`;
  }

  if (intent === "swap") {
    return `Pozdrav, vidio/la sam oglas "${title}" na Buvljaku. Imam prijedlog za zamjenu: ${cleanMessage ?? "javim detalje."}`;
  }

  if (intent === "have_item") {
    return `Pozdrav, vidio/la sam da tražite "${title}" na Buvljaku. Imam nešto što bi vam moglo odgovarati: ${cleanMessage ?? "javim detalje."}`;
  }

  if (intent === "pickup" || type === "give") {
    return `Pozdrav, vidio/la sam da poklanjate "${title}" na Buvljaku. Je li još dostupno za preuzimanje?`;
  }

  return `Pozdrav, vidio/la sam oglas "${title}" na Buvljaku. Je li još dostupno?`;
}

function emailSubject(title: string, action: string) {
  return action === "offer" ? `Ponuda za oglas: ${title}` : `Upit za oglas: ${title}`;
}

async function sendContactEmail({
  to,
  from,
  apiKey,
  subject,
  message,
  requesterEmail,
  listingUrl
}: {
  to: string;
  from: string;
  apiKey: string;
  subject: string;
  message: string;
  requesterEmail?: string;
  listingUrl: string;
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
      subject,
      text: [
        message,
        "",
        `Oglas: ${listingUrl}`,
        requesterEmail ? `Email zainteresiranog korisnika: ${requesterEmail}` : undefined,
        "",
        "Ova poruka je poslana kroz Buvljak kontakt resolver. Privatni kontakt podaci nisu javno prikazani."
      ]
        .filter(Boolean)
        .join("\n")
    })
  });

  return response.ok;
}

export const prepareContactRequest = internalMutation({
  args: {
    listingId: v.id("listings"),
    source: contactSourceValidator,
    intent: v.optional(contactIntentValidator),
    offerAmount: v.optional(v.number()),
    message: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Prijavi se da možeš poslati upit."
      };
    }

    const now = Date.now();
    const clerkUserId = identity.subject;
    const displayName =
      optionalString(identity.name) ??
      optionalString(identity.email) ??
      "Korisnik Buvljaka";
    const requesterEmail = optionalString(identity.email);

    let currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!currentUser) {
      const userId = await ctx.db.insert("users", {
        clerkUserId,
        displayName,
        ...(requesterEmail ? { email: requesterEmail } : {}),
        createdAt: now,
        updatedAt: now,
        role: "user",
        plan: "free"
      });
      currentUser = await ctx.db.get(userId);
    }

    if (currentUser?.isBlocked) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Tvoj korisnički račun je blokiran za kontaktiranje oglasa."
      };
    }

    const listing = await ctx.db.get(args.listingId);

    if (!listing) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Oglas nije pronađen."
      };
    }

    if (listing.status !== "active") {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Ovaj oglas više nije aktivan."
      };
    }

    if (currentUser && listing.ownerId === currentUser._id) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Ovo je tvoj oglas."
      };
    }

    if (args.intent === "offer" && (!args.offerAmount || args.offerAmount <= 0)) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Upiši iznos ponude."
      };
    }

    if ((args.intent === "swap" || args.intent === "have_item") && !optionalString(args.message)) {
      return {
        ok: false,
        method: "none" as const,
        displayMessage: "Napiši kratku poruku prije slanja."
      };
    }

    if (listing.contactMethod === "none") {
      return {
        ok: false,
        method: "none" as const,
        displayMessage:
          "Oglašivač nije ostavio kontakt u Buvljaku. Ako je oglas podijeljen iz Facebook grupe, pokušaj kontaktirati putem originalne objave."
      };
    }

    if (listing.contactMethod === "email" && !requesterEmail) {
      return {
        ok: false,
        method: "email" as const,
        displayMessage: "Prijavi se s email adresom da možeš poslati upit."
      };
    }

    if (listing.contactMethod === "whatsapp" && !optionalString(listing.contactPhone)) {
      return {
        ok: false,
        method: "whatsapp" as const,
        displayMessage: "WhatsApp kontakt trenutno nije dostupan."
      };
    }

    if (listing.contactMethod === "email" && !optionalString(listing.contactEmail)) {
      return {
        ok: false,
        method: "email" as const,
        displayMessage: "Email kontakt trenutno nije dostupan."
      };
    }

    if (listing.contactMethod === "facebook" && !optionalString(listing.contactFacebookUrl)) {
      return {
        ok: false,
        method: "facebook" as const,
        displayMessage: "Facebook kontakt trenutno nije dostupan."
      };
    }

    const dayAgo = now - 24 * 60 * 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const recentEvents = currentUser
      ? await ctx.db
          .query("rateLimitEvents")
          .withIndex("by_userId_createdAt", (q) => q.eq("userId", currentUser!._id).gte("createdAt", dayAgo))
          .collect()
      : [];
    const lastHourCount = recentEvents.filter((event) => event.createdAt >= hourAgo).length;
    const listingDayCount = recentEvents.filter((event) => event.listingId === args.listingId).length;

    if (lastHourCount >= 5 || recentEvents.length >= 20 || listingDayCount >= 3) {
      return {
        ok: false,
        method: listing.contactMethod,
        rateLimited: true,
        displayMessage: "Poslao/la si previše upita u kratkom vremenu. Pokušaj kasnije."
      };
    }

    const rateLimitAction = actionForRequest(listing.contactMethod, args.intent);
    const contactMessage = buildContactMessage({
      title: listing.title,
      type: listing.type,
      intent: args.intent,
      offerAmount: args.offerAmount,
      message: args.message
    });

    return {
      ok: true,
      listingId: listing._id,
      userId: currentUser?._id,
      requesterEmail,
      method: listing.contactMethod,
      source: args.source,
      intent: args.intent ?? "contact",
      rateLimitAction,
      title: listing.title,
      type: listing.type,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      contactFacebookUrl: listing.contactFacebookUrl,
      offerAmount: args.offerAmount,
      message: optionalString(args.message),
      contactMessage
    };
  }
});

export const recordContactSuccess = internalMutation({
  args: {
    listingId: v.id("listings"),
    userId: v.optional(v.id("users")),
    method: contactMethodValidator,
    source: contactSourceValidator,
    action: rateLimitActionValidator,
    intent: v.optional(contactIntentValidator),
    offerAmount: v.optional(v.number()),
    message: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);

    if (!listing) {
      return;
    }

    const now = Date.now();

    await ctx.db.patch(args.listingId, {
      contactClickCount: listing.contactClickCount + 1,
      updatedAt: now
    });

    await ctx.db.insert("contactEvents", {
      listingId: args.listingId,
      ...(args.userId ? { viewerUserId: args.userId } : {}),
      method: args.method,
      source: args.source,
      createdAt: now
    });

    await ctx.db.insert("rateLimitEvents", {
      ...(args.userId ? { userId: args.userId } : {}),
      listingId: args.listingId,
      action: args.action,
      createdAt: now,
      source: args.source
    });

    if (args.action === "offer") {
      await ctx.db.insert("offers", {
        listingId: args.listingId,
        ...(args.userId ? { fromUserId: args.userId } : {}),
        ...(args.offerAmount !== undefined ? { amount: args.offerAmount } : {}),
        message: optionalString(args.message) ?? "Ponuda poslana kroz Buvljak kontakt resolver.",
        status: "sent",
        createdAt: now
      });
    }
  }
});

export const requestContactInfo = action({
  args: {
    listingId: v.id("listings"),
    source: contactSourceValidator,
    intent: v.optional(contactIntentValidator),
    offerAmount: v.optional(v.number()),
    message: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const prepared = await ctx.runMutation(internal.contact.prepareContactRequest, args);

    if (!prepared.ok) {
      return {
        method: prepared.method,
        emailSent: false,
        displayMessage: prepared.displayMessage
      };
    }

    const listingUrl = getPublicListingUrl(prepared.listingId);
    const successArgs = {
      listingId: prepared.listingId as Id<"listings">,
      ...(prepared.userId ? { userId: prepared.userId as Id<"users"> } : {}),
      method: prepared.method,
      source: prepared.source,
      action: prepared.rateLimitAction,
      intent: prepared.intent,
      ...(prepared.offerAmount !== undefined ? { offerAmount: prepared.offerAmount } : {}),
      ...(prepared.message ? { message: prepared.message } : {})
    };

    if (prepared.method === "whatsapp") {
      const phone = normalizePhoneForWhatsApp(prepared.contactPhone);

      if (!phone) {
        return {
          method: "whatsapp" as const,
          emailSent: false,
          displayMessage: "WhatsApp kontakt trenutno nije dostupan."
        };
      }

      await ctx.runMutation(internal.contact.recordContactSuccess, successArgs);

      return {
        method: "whatsapp" as const,
        redirectUrl: `https://wa.me/${phone}?text=${encodeURIComponent(prepared.contactMessage)}`,
        emailSent: false,
        displayMessage: "Otvaram WhatsApp."
      };
    }

    if (prepared.method === "facebook") {
      await ctx.runMutation(internal.contact.recordContactSuccess, successArgs);

      return {
        method: "facebook" as const,
        redirectUrl: prepared.contactFacebookUrl,
        emailSent: false,
        displayMessage: "Otvaram Facebook kontakt."
      };
    }

    if (prepared.method === "email") {
      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.CONTACT_FROM_EMAIL;

      if (!resendApiKey || !fromEmail) {
        return {
          method: "email" as const,
          emailSent: false,
          displayMessage: "Email trenutno nije dostupan. Pokušaj kasnije ili odaberi drugi kontakt kanal."
        };
      }

      const sent = await sendContactEmail({
        to: prepared.contactEmail,
        from: fromEmail,
        apiKey: resendApiKey,
        subject: emailSubject(prepared.title, prepared.rateLimitAction),
        message: prepared.contactMessage,
        requesterEmail: prepared.requesterEmail,
        listingUrl
      });

      if (!sent) {
        return {
          method: "email" as const,
          emailSent: false,
          displayMessage: "Email trenutno nije dostupan. Pokušaj kasnije."
        };
      }

      await ctx.runMutation(internal.contact.recordContactSuccess, successArgs);

      return {
        method: "email" as const,
        emailSent: true,
        displayMessage: "Upit je poslan oglašivaču."
      };
    }

    return {
      method: "none" as const,
      emailSent: false,
      displayMessage:
        "Oglašivač nije ostavio kontakt u Buvljaku. Ako je oglas podijeljen iz Facebook grupe, pokušaj kontaktirati putem originalne objave."
    };
  }
});
