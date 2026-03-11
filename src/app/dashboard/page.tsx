import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import ScoutDashboard from "./ScoutDashboard";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
    select: {
      id: true,
      name: true,
      birthYear: true,
      school: true,
      position: true,
      preferredFoot: true,
      height: true,
      yearsExp: true,
      yearsExpStartYear: true,
      scheduleRegs: {
        select: {
          id: true,
          status: true,
          isGK: true,
          teamLabel: true,
          jerseyNumber: true,
          schedule: { select: { id: true, title: true, type: true, scheduledAt: true, location: true, status: true } },
          team: { select: { name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      offersReceived: {
        select: {
          id: true, status: true, clubName: true, message: true,
          scout: { select: { name: true, organization: true } },
        },
      },
      votesGiven: {
        select: { scheduleId: true, voteType: true },
      },
    },
  });

  const playersWithDynamicYears = players.map((p) => ({
    ...p,
    yearsExpCurrent: p.yearsExpStartYear ? currentYear - p.yearsExpStartYear : p.yearsExp,
  }));

  // 서버에서 미리 투표 미완료 경기 계산 (팝업 즉시 표시용)
  const myPlayerIds = players.map((p) => p.id);
  let pendingVotes: { scheduleId: string; title: string }[] = [];

  try {
    if (myPlayerIds.length > 0) {
      const myRegs = await prisma.scheduleRegistration.findMany({
        where: { playerId: { in: myPlayerIds }, status: "CONFIRMED", schedule: { status: "ENDED" } },
        select: { scheduleId: true, schedule: { select: { title: true } } },
      });

      const seen = new Map<string, string>();
      for (const r of myRegs) seen.set(r.scheduleId, r.schedule.title);

      for (const [scheduleId, title] of seen.entries()) {
        const otherCount = await prisma.scheduleRegistration.count({
          where: { scheduleId, status: { not: "CANCELLED" }, playerId: { notIn: myPlayerIds } },
        });
        if (otherCount < 2) continue;

        const myVotes = await prisma.playerVote.findMany({
          where: { scheduleId, voterId: { in: myPlayerIds } },
        });
        const hasMvp = myVotes.some((v) => v.voteType === "MVP");
        const hasFp = myVotes.some((v) => v.voteType === "FAIRPLAY");
        if (!hasMvp || !hasFp) pendingVotes.push({ scheduleId, title });
      }
    }
  } catch {
    pendingVotes = [];
  }

  return (
    <DashboardClient
      userName={user.name}
      players={JSON.parse(JSON.stringify(playersWithDynamicYears))}
      initialPendingVotes={pendingVotes}
    />
  );
}
