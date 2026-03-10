import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import ScoutDashboard from "./ScoutDashboard";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as { id: string; role: string; name: string };
  if (user.role === "ADMIN") redirect("/admin");

  if (user.role === "SCOUT" || user.role === "DIRECTOR") {
    const offers = await prisma.recruitmentOffer.findMany({
      where: { scoutId: user.id },
      include: { player: { select: { id: true, name: true, school: true, position: true, birthYear: true, parentPhone: true } } },
      orderBy: { createdAt: "desc" },
    });
    return <ScoutDashboard userName={user.name} role={user.role} offers={JSON.parse(JSON.stringify(offers))} />;
  }

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
