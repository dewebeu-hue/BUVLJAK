import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  contactMethodValidator,
  contactSourceValidator,
  contactVisibilityValidator,
  listingStatusValidator,
  listingTypeValidator,
  offerStatusValidator,
  priceTypeValidator,
  reportStatusValidator,
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
    role: userRoleValidator
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

  contactEvents: defineTable({
    listingId: v.id("listings"),
    viewerUserId: v.optional(v.id("users")),
    method: contactMethodValidator,
    source: contactSourceValidator,
    createdAt: v.number()
  }).index("by_listingId", ["listingId"]),

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

  savedSearches: defineTable({
    userId: v.optional(v.id("users")),
    query: v.string(),
    city: v.optional(v.string()),
    category: v.optional(v.string()),
    type: v.optional(listingTypeValidator),
    maxPrice: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastNotifiedAt: v.optional(v.number())
  }).index("by_userId", ["userId"])
});
