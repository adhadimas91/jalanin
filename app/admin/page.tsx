import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { getAdminSnapshot } from "@/lib/admin";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const snapshot = await getAdminSnapshot();

  return <AdminConsole initialData={snapshot} adminEmail={user.email} />;
}
