export function normalizedAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLocaleLowerCase("hr-HR") ?? "";
}

export function isConfiguredAdminEmail(email?: string | null) {
  const adminEmail = normalizedAdminEmail();
  const currentEmail = email?.trim().toLocaleLowerCase("hr-HR");

  return Boolean(adminEmail && currentEmail && currentEmail === adminEmail);
}
