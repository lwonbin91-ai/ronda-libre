import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: string; name: string };
  if (user.role === "ADMIN") redirect("/admin");

  const currentYear = new Date().getFullYear();

  const players = await prisma.player.findMany({
    where: { userId: user.id },
    include: {
      scheduleRegs: {
        include: {
          schedule: { select: { id: true, title: true, type: true, scheduledAt: true } },
          team: { select: { name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      offersReceived: {
        include: { scout: { select: { name: true, organization: true } } },
      },
    },
  });

  const playersWithDynamicYears = players.map((p) => ({
    ...p,
    yearsExpCurrent: p.yearsExpStartYear ? currentYear - p.yearsExpStartYear : p.yearsExp,
  }));

  return (
    <DashboardClient
      userName={user.name}
      players={JSON.parse(JSON.stringify(playersWithDynamicYears))}
    />
  );
}
