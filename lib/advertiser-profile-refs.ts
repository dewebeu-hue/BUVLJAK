import { makeFunctionReference } from "convex/server";

export type AdvertiserAccountType = "individual" | "business";

export type AdvertiserProfile = {
  _id: string;
  _creationTime: number;
  userId: string;
  accountType: AdvertiserAccountType;
  firstName: string;
  lastName: string;
  oib: string;
  country: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  county: string;
  phone: string;
  publicCityEnabled: boolean;
  publicPhoneEnabled: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type AdvertiserProfileStatus = {
  isComplete: boolean;
  missingFields: string[];
  completedAt?: number;
  updatedAt?: number;
  publicCityEnabled: boolean;
  publicPhoneEnabled: boolean;
};

export type AdvertiserProfileInput = {
  accountType?: AdvertiserAccountType;
  firstName: string;
  lastName: string;
  oib: string;
  country: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  county: string;
  phone: string;
  publicCityEnabled: boolean;
  publicPhoneEnabled: boolean;
};

export const getMyAdvertiserProfileRef = makeFunctionReference<
  "query",
  Record<string, never>,
  AdvertiserProfile | null
>("advertiserProfiles:getMyAdvertiserProfile");

export const getMyAdvertiserProfileStatusRef = makeFunctionReference<
  "query",
  Record<string, never>,
  AdvertiserProfileStatus
>("advertiserProfiles:getMyAdvertiserProfileStatus");

export const upsertMyAdvertiserProfileRef = makeFunctionReference<
  "mutation",
  AdvertiserProfileInput,
  {
    isComplete: boolean;
    missingFields: string[];
    completedAt: number;
    updatedAt: number;
  }
>("advertiserProfiles:upsertMyAdvertiserProfile");
