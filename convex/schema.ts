import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  contactMethodValidator,
  contactSourceValidator,
  contactVisibilityValidator,
  featuredLabelValidator,
  listingStatusValidator,
  listingTypeValidator,
  notificationChannelValidator,
  notificationStatusValidator,
  offerStatusValidator,
  priceTypeValidator,
  reportStatusValidator,
  sponsorPlacementValidator,
  userPlanValidator,
  userRoleValidator
} from "./validators";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.optional(v.string()),
    displayName: v.string(),
    email: v.optional(v.string()),
    city: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    role: userRoleValidator,
    plan: v.optional(userPlanValidator),
    planExpiresAt: v.optional(v.number()),
    isBlocked: v.optional(v.boolean()),
    blockedReason: v.optional(v.string())
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_role", ["role"]),

  listings: defineTable({
    ownerId: v.optional(v.id("users")),
    type: listingTypeValidator,
    title: v.string(),
    description: v.string(),
    city: v.string(),
    category: v.string(),
    price: v.optional(v.number()),
    priceType: priceTypeValidator,
    status: listingStatusValidator,
    contactMethod: contactMethodValidator,
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactFacebookUrl: v.optional(v.string()),
    contactVisibility: contactVisibilityValidator,
    allowOffers: v.boolean(),
    images: v.array(v.string()),
    viewCount: v.number(),
    contactClickCount: v.number(),
    shareCount: v.number(),
    saveCount: v.number(),
    importSource: v.optional(v.union(v.literal("manual"), v.literal("facebook_text"), v.literal("facebook_url"))),
    sourceFacebookUrl: v.optional(v.string()),
    importedRawText: v.optional(v.string()),
    importParsedAt: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
    featuredUntil: v.optional(v.number()),
    featuredLabel: v.optional(featuredLabelValidator),
    featuredCreatedAt: v.optional(v.number()),
    isDemo: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    removedReason: v.optional(v.string())
  })
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_city", ["city"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_ownerId", ["ownerId"]),

  monetizationSettings: defineTable({
    localSponsorsEnabled: v.boolean(),
    featuredListingsEnabled: v.boolean(),
    pricingPageVisible: v.optional(v.boolean()),
    proPlansEnabled: v.boolean(),
    paymentsEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users"))
  }).index("by_updatedAt", ["updatedAt"]),

  localSponsors: defineTable({
    name: v.string(),
    headline: v.string(),
    body: v.optional(v.string()),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    href: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    placement: sponsorPlacementValidator,
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users"))
  })
    .index("by_isActive", ["isActive"])
    .index("by_placement", ["placement"]),

  contactEvents: defineTable({
    listingId: v.id("listings"),
    viewerUserId: v.optional(v.id("users")),
    method: contactMethodValidator,
    source: contactSourceValidator,
    createdAt: v.number()
  }).index("by_listingId", ["listingId"]),

  rateLimitEvents: defineTable({
    userId: v.optional(v.id("users")),
    listingId: v.optional(v.id("listings")),
    action: v.union(v.literal("contact"), v.literal("email"), v.literal("offer")),
    createdAt: v.number(),
    source: v.optional(contactSourceValidator)
  })
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_listingId_createdAt", ["listingId", "createdAt"]),

  offers: defineTable({
    listingId: v.id("listings"),
    fromUserId: v.optional(v.id("users")),
    amount: v.optional(v.number()),
    message: v.string(),
    status: offerStatusValidator,
    createdAt: v.number()
  }).index("by_listingId", ["listingId"]),

  reports: defineTable({
    listingId: v.id("listings"),
    reporterUserId: v.optional(v.id("users")),
    reason: v.string(),
    status: reportStatusValidator,
    createdAt: v.number()
  }).index("by_status", ["status"]),

  savedListings: defineTable({
    userId: v.id("users"),
    listingId: v.id("listings"),
    createdAt: v.number(),
    savedAt: v.number()
  })
    .index("by_userId_and_listingId", ["userId", "listingId"])
    .index("by_userId_and_savedAt", ["userId", "savedAt"])
    .index("by_listingId", ["listingId"]),

  savedSearches: defineTable({
    userId: v.optional(v.id("users")),
    query: v.string(),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(listingTypeValidator),
    maxPrice: v.optional(v.number()),
    isActive: v.boolean(),
    notifyByEmail: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastNotifiedAt: v.optional(v.number())
  })
    .index("by_userId", ["userId"])
    .index("by_isActive", ["isActive"]),

  notificationEvents: defineTable({
    userId: v.optional(v.id("users")),
    savedSearchId: v.id("savedSearches"),
    listingId: v.id("listings"),
    channel: notificationChannelValidator,
    status: notificationStatusValidator,
    reason: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_savedSearch_listing", ["savedSearchId", "listingId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
});
