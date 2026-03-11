import { prisma } from "@/lib/prisma";
import StandingsTabs from "./StandingsTabs";
import { finalizeExpiredMatches } from "@/lib/voteAggregation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  // 24시간 경과 경기 자동 처리 (백그라운드)
  finalizeExpiredMatches().catch(() => {});

  const [seasonPlayers, openPlayers] = await Promise.all([
    prisma.player.findMany({
      where: { scheduleRegs: { some: { schedule: { type: "SEASON" }, status: { not: "CANCELLED" } } } },
      select: {
        id: true, name: true, position: true, school: true, birthYear: true,
        scheduleRegs: {
          where: { schedule: { type: "SEASON" }, status: { not: "CANCELLED" } },
          select: { isMVP: true, isFairplay: true },
        },
      },
    }),
    prisma.player.findMany({
      where: { scheduleRegs: { some: { schedule: { type: "ONEDAY" }, status: { not: "CANCELLED" } } } },
      select: {
        id: true, name: true, position: true, school: true, birthYear: true,
        scheduleRegs: {
          where: { schedule: { type: "ONEDAY" }, status: { not: "CANCELLED" } },
          select: { isMVP: true, isFairplay: true },
        },
      },
    }),
  ]);

  const buildRanking = (players: typeof seasonPlayers) =>
    players.map((p) => {
      const mvp = p.scheduleRegs.filter((r) => r.isMVP).length;
      const fairplay = p.scheduleRegs.filter((r) => r.isFairplay).length;
      const games = p.scheduleRegs.length;
      return {
        id: p.id, name: p.name, position: p.position, school: p.school, birthYear: p.birthYear,
        mvp, fairplay, games,
        score: mvp * 3 + fairplay * 2 + games,
      };
    })
    .filter((p) => p.games > 0)
    .sort((a, b) => b.score - a.score || b.mvp - a.mvp || b.fairplay - a.fairplay)
    .slice(0, 50);

  return (
    <StandingsTabs
      seasonRanking={buildRanking(seasonPlayers)}
      openRanking={buildRanking(openPlayers)}
    />
  );
}
