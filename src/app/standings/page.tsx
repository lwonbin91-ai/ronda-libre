import { prisma } from "@/lib/prisma";
import StandingsTabs from "./StandingsTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const [seasonPlayers, openPlayers] = await Promise.all([
    prisma.player.findMany({
      where: { scheduleRegs: { some: { schedule: { type: "SEASON" }, status: { not: "CANCELLED" } } } },
      select: {
        id: true, name: true, position: true, school: true, birthYear: true,
        scheduleRegs: {
          where: { schedule: { type: "SEASON" }, status: { not: "CANCELLED" } },
          select: { isMVP: true, isFairplay: true },
        },
        votesReceived: {
          where: { schedule: { type: "SEASON" } },
          select: { voteType: true },
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
        votesReceived: {
          where: { schedule: { type: "ONEDAY" } },
          select: { voteType: true },
        },
      },
    }),
  ]);

  const buildRanking = (players: typeof seasonPlayers) =>
    players.map((p) => {
      const mvpVotes = p.votesReceived.filter((v) => v.voteType === "MVP").length;
      const fairplayVotes = p.votesReceived.filter((v) => v.voteType === "FAIRPLAY").length;
      const mvpAward = p.scheduleRegs.filter((r) => r.isMVP).length;
      const fairplayAward = p.scheduleRegs.filter((r) => r.isFairplay).length;
      const totalMVP = mvpVotes + mvpAward;
      const totalFairplay = fairplayVotes + fairplayAward;
      return {
        id: p.id, name: p.name, position: p.position, school: p.school, birthYear: p.birthYear,
        mvp: totalMVP, fairplay: totalFairplay, games: p.scheduleRegs.length,
        score: totalMVP * 3 + totalFairplay * 2 + p.scheduleRegs.length,
      };
    })
    .filter((p) => p.games > 0)
    .sort((a, b) => b.score - a.score || b.mvp - a.mvp || b.fairplay - a.fairplay);

  return (
    <StandingsTabs
      seasonRanking={buildRanking(seasonPlayers)}
      openRanking={buildRanking(openPlayers)}
    />
  );
}

