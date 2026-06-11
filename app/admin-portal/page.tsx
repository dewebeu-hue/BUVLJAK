import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";

const ADMIN_EMAIL = "deweb.eu@gmail.com";

function normalizedEmail(value?: string | null) {
  return value?.trim().toLocaleLowerCase("hr-HR");
}

export default async function AdminPortalPage() {
  const user = await currentUser();
  const email = normalizedEmail(user?.primaryEmailAddress?.emailAddress);

  if (email !== ADMIN_EMAIL) {
    notFound();
  }

  return <AdminDashboard />;
}
