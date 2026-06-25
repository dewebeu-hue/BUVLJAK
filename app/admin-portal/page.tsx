import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { isConfiguredAdminEmail } from "@/lib/admin";

export default async function AdminPortalPage() {
  const user = await currentUser();

  if (!isConfiguredAdminEmail(user?.primaryEmailAddress?.emailAddress)) {
    notFound();
  }

  return <AdminDashboard />;
}
