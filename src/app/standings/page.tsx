import { getCachedStandingsPlayers } from "@/lib/dataCache";
import StandingsTabs from "./StandingsTabs";
import { finalizeExpiredMatches } from "@/lib/voteAggregation";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  finalizeExpiredMatches().catch(() => {});

  const { season: seasonPlayers, open: openPlayers } = await getCachedStandingsPlayers();

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
