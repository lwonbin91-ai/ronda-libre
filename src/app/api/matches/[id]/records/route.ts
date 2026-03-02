import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const { playerId, goals, assists, minutesPlayed, rating, notes } = await req.json();
    const record = await prisma.matchPlayerRecord.upsert({
      where: { matchId_playerId: { matchId, playerId } },
      create: { matchId, playerId, goals, assists, minutesPlayed, rating, notes },
      update: { goals, assists, minutesPlayed, rating, notes },
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
