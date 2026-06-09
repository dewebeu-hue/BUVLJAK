import { v } from "convex/values";

export const userRoleValidator = v.union(v.literal("user"), v.literal("admin"));

export const userPlanValidator = v.union(
  v.literal("free"),
  v.literal("pro_mini"),
  v.literal("pro_local"),
  v.literal("pro_plus")
);

export const listingTypeValidator = v.union(
  v.literal("sell"),
  v.literal("give"),
  v.literal("swap"),
  v.literal("want")
);

export const listingStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("resolved"),
  v.literal("removed")
);

export const featuredLabelValidator = v.union(
  v.literal("Istaknuto"),
  v.literal("Hitno"),
  v.literal("Top oglas")
);

export const contactMethodValidator = v.union(
  v.literal("whatsapp"),
  v.literal("email"),
  v.literal("facebook"),
  v.literal("none")
);

export const priceTypeValidator = v.union(
  v.literal("fixed"),
  v.literal("negotiable"),
  v.literal("free"),
  v.literal("swap"),
  v.literal("wanted")
);

export const contactVisibilityValidator = v.literal("hidden_until_click");

export const contactSourceValidator = v.union(
  v.literal("listing_page"),
  v.literal("feed_card"),
  v.literal("saved_search_email"),
  v.literal("facebook_link")
);

export const notificationChannelValidator = v.literal("email");

export const notificationStatusValidator = v.union(
  v.literal("sent"),
  v.literal("skipped"),
  v.literal("failed")
);

export const offerStatusValidator = v.union(
  v.literal("sent"),
  v.literal("accepted"),
  v.literal("declined")
);

export const reportStatusValidator = v.union(
  v.literal("new"),
  v.literal("reviewed"),
  v.literal("dismissed"),
  v.literal("action_taken")
);

export const sponsorPlacementValidator = v.union(
  v.literal("feed"),
  v.literal("listing_detail")
);
