import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLoader from "./DashboardLoader";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: string; name: string };
  if (user.role === "ADMIN") redirect("/admin");

  return <DashboardLoader userName={user.name} role={user.role} />;
}
