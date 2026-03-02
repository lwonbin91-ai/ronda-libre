export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
        videos: true,
        playerRecords: { include: { player: true } },
      },
      orderBy: { playedAt: "desc" },
    });
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const match = await prisma.match.create({
      data: {
        seasonId: data.seasonId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        homeScore: data.homeScore || 0,
        awayScore: data.awayScore || 0,
        playedAt: new Date(data.playedAt),
        location: data.location || null,
        notes: data.notes || null,
      },
      include: { homeTeam: true, awayTeam: true, season: true },
    });
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
