export const SUPPORT_EMAIL = "info@buvljak.hr";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

export function supportMailtoHref(subject?: string) {
  return subject ? `${SUPPORT_MAILTO}?subject=${encodeURIComponent(subject)}` : SUPPORT_MAILTO;
}
