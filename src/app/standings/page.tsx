import { prisma } from "@/lib/prisma";
import StandingsTabs from "./StandingsTabs";

export const revalidate = 0;

export default async function StandingsPage() {
  const seasonPlayers = await prisma.player.findMany({
    where: { scheduleRegs: { some: { schedule: { type: "SEASON" }, status: "CONFIRMED" } } },
    select: {
      id: true, name: true, position: true, school: true, birthYear: true,
      scheduleRegs: {
        where: { schedule: { type: "SEASON" }, status: "CONFIRMED" },
        select: { isMVP: true, isFairplay: true },
      },
      votesReceived: { select: { voteType: true } },
    },
  });

  const openPlayers = await prisma.player.findMany({
    where: { scheduleRegs: { some: { schedule: { type: "ONEDAY" }, status: "CONFIRMED" } } },
    select: {
      id: true, name: true, position: true, school: true, birthYear: true,
      scheduleRegs: {
        where: { schedule: { type: "ONEDAY" }, status: "CONFIRMED" },
        select: { isMVP: true, isFairplay: true },
      },
      votesReceived: { select: { voteType: true } },
    },
  });

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
        score: totalMVP * 2 + totalFairplay,
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
