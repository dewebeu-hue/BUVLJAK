const DEV_APP_URL = "http://localhost:3000";

function cleanBaseUrl(value?: string) {
  const cleaned = value?.trim().replace(/\/+$/, "");
  return cleaned || undefined;
}

export function getAppBaseUrl() {
  const configuredUrl = cleanBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return DEV_APP_URL;
}

export function getPublicListingPath(listingId: string) {
  return `/oglasi/${encodeURIComponent(listingId)}`;
}

export function getPublicListingUrl(listingId: string, baseUrl = getAppBaseUrl()) {
  return `${cleanBaseUrl(baseUrl) ?? DEV_APP_URL}${getPublicListingPath(listingId)}`;
}

export function getListingOgImageUrl(listingId: string, baseUrl = getAppBaseUrl()) {
  return `${cleanBaseUrl(baseUrl) ?? DEV_APP_URL}/api/og/listing/${encodeURIComponent(listingId)}`;
}

export function getDefaultOgImageUrl(baseUrl = getAppBaseUrl()) {
  return getListingOgImageUrl("default", baseUrl);
}
