/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as authDebug from "../authDebug.js";
import type * as contact from "../contact.js";
import type * as facebookImports from "../facebookImports.js";
import type * as facebookPosts from "../facebookPosts.js";
import type * as listings from "../listings.js";
import type * as monetization from "../monetization.js";
import type * as savedSearches from "../savedSearches.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  authDebug: typeof authDebug;
  contact: typeof contact;
  facebookImports: typeof facebookImports;
  facebookPosts: typeof facebookPosts;
  listings: typeof listings;
  monetization: typeof monetization;
  savedSearches: typeof savedSearches;
  seed: typeof seed;
  users: typeof users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
