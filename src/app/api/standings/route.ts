export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: {
        scheduleRegs: {
          some: { schedule: { type: "SEASON" }, status: "CONFIRMED" },
        },
      },
      select: {
        id: true,
        name: true,
        position: true,
        school: true,
        birthYear: true,
        scheduleRegs: {
          where: { schedule: { type: "SEASON" }, status: "CONFIRMED" },
          select: { isMVP: true, isFairplay: true },
        },
        votesReceived: {
          select: { voteType: true },
        },
      },
    });

    const result = players
      .map((p) => {
        const mvpVotes = p.votesReceived.filter((v) => v.voteType === "MVP").length;
        const fairplayVotes = p.votesReceived.filter((v) => v.voteType === "FAIRPLAY").length;
        const mvpAward = p.scheduleRegs.filter((r) => r.isMVP).length;
        const fairplayAward = p.scheduleRegs.filter((r) => r.isFairplay).length;
        const totalMVP = mvpVotes + mvpAward;
        const totalFairplay = fairplayVotes + fairplayAward;
        const totalGames = p.scheduleRegs.length;
        return {
          id: p.id,
          name: p.name,
          position: p.position,
          school: p.school,
          birthYear: p.birthYear,
          mvp: totalMVP,
          fairplay: totalFairplay,
          games: totalGames,
          score: totalMVP * 3 + totalFairplay * 2 + totalGames,
        };
      })
      .filter((p) => p.games > 0)
      .sort((a, b) => b.score - a.score || b.mvp - a.mvp || b.fairplay - a.fairplay);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
