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

  // 메인 쿼리와 무관한 초기 병렬 처리 가능하도록 쿼리 분리
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

  // myPlayerIds 계산
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
      const scheduleIds = [...seen.keys()];

      if (scheduleIds.length > 0) {
        // N+1 제거: 두 쿼리를 병렬로 한 번에 실행
        const [allOtherRegs, allMyVotes] = await Promise.all([
          prisma.scheduleRegistration.findMany({
            where: { scheduleId: { in: scheduleIds }, status: { not: "CANCELLED" }, playerId: { notIn: myPlayerIds } },
            select: { scheduleId: true },
          }),
          prisma.playerVote.findMany({
            where: { scheduleId: { in: scheduleIds }, voterId: { in: myPlayerIds } },
            select: { scheduleId: true, voteType: true },
          }),
        ]);

        const otherCountMap = new Map<string, number>();
        for (const r of allOtherRegs) otherCountMap.set(r.scheduleId, (otherCountMap.get(r.scheduleId) ?? 0) + 1);

        const voteMap = new Map<string, { mvp: boolean; fp: boolean }>();
        for (const v of allMyVotes) {
          const e = voteMap.get(v.scheduleId) ?? { mvp: false, fp: false };
          if (v.voteType === "MVP") e.mvp = true;
          if (v.voteType === "FAIRPLAY") e.fp = true;
          voteMap.set(v.scheduleId, e);
        }

        for (const [scheduleId, title] of seen.entries()) {
          if ((otherCountMap.get(scheduleId) ?? 0) < 2) continue;
          const v = voteMap.get(scheduleId) ?? { mvp: false, fp: false };
          if (!v.mvp || !v.fp) pendingVotes.push({ scheduleId, title });
        }
      }
    }
  } catch {
    pendingVotes = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playersOut = players.map((p) => ({
    ...p,
    yearsExpCurrent: p.yearsExpStartYear ? currentYear - p.yearsExpStartYear : (p.yearsExp ?? null),
  })) as any;

  return (
    <DashboardClient
      userName={user.name}
      players={playersOut}
      initialPendingVotes={pendingVotes}
    />
  );
}
