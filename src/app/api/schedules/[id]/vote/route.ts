export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string };

  try {
    const myPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
    if (!myPlayer) {
      return NextResponse.json({ myPlayerId: null, participants: [], myVotes: [] });
    }

    const [participants, myVotes] = await Promise.all([
      prisma.scheduleRegistration.findMany({
        where: { scheduleId, status: "CONFIRMED" },
        include: { player: { select: { id: true, name: true, position: true, school: true } } },
      }),
      prisma.playerVote.findMany({
        where: { scheduleId, voterId: myPlayer.id },
      }),
    ]);

    return NextResponse.json({
      myPlayerId: myPlayer.id,
      participants: participants.map((r) => r.player),
      myVotes,
    });
  } catch (e) {
    console.error("vote GET error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string };

  try {
    const { targetId, voteType } = await req.json();

    if (!["MVP", "FAIRPLAY"].includes(voteType)) {
      return NextResponse.json({ error: "유효하지 않은 투표 유형" }, { status: 400 });
    }

    const myPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
    if (!myPlayer) return NextResponse.json({ error: "선수 프로필 없음" }, { status: 404 });

    if (myPlayer.id === targetId) {
      return NextResponse.json({ error: "자신에게는 투표할 수 없습니다." }, { status: 400 });
    }

    const myReg = await prisma.scheduleRegistration.findUnique({
      where: { scheduleId_playerId: { scheduleId, playerId: myPlayer.id } },
    });
    if (!myReg || myReg.status !== "CONFIRMED") {
      return NextResponse.json({ error: "이 경기 참가자만 투표할 수 있습니다." }, { status: 403 });
    }

    const targetReg = await prisma.scheduleRegistration.findUnique({
      where: { scheduleId_playerId: { scheduleId, playerId: targetId } },
    });
    if (!targetReg || targetReg.status !== "CONFIRMED") {
      return NextResponse.json({ error: "해당 선수는 이 경기 참가자가 아닙니다." }, { status: 400 });
    }

    const vote = await prisma.playerVote.upsert({
      where: { scheduleId_voterId_voteType: { scheduleId, voterId: myPlayer.id, voteType } },
      create: { scheduleId, voterId: myPlayer.id, targetId, voteType },
      update: { targetId },
    });

    return NextResponse.json(vote);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
