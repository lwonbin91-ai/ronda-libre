import { tryAggregateVotes } from "@/lib/voteAggregation";
import { revalidateTag } from "next/cache";

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
    const schedule = await prisma.matchSchedule.findUnique({ where: { id: scheduleId }, select: { id: true, status: true, title: true } });
    if (!schedule) return NextResponse.json({ error: "경기를 찾을 수 없습니다." }, { status: 404 });
    if (schedule.status !== "ENDED") return NextResponse.json({ error: "경기가 종료된 후에만 투표할 수 있습니다." }, { status: 403 });

    const myPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
    if (!myPlayer) return NextResponse.json({ myPlayerId: null, participants: [], myVotes: [], myTeam: null });

    const [allRegs, myVotes] = await Promise.all([
      prisma.scheduleRegistration.findMany({
        where: { scheduleId, status: { not: "CANCELLED" } },
        include: { player: { select: { id: true, name: true, position: true, school: true } } },
        orderBy: [{ teamLabel: "asc" }, { jerseyNumber: "asc" }],
      }),
      prisma.playerVote.findMany({ where: { scheduleId, voterId: myPlayer.id } }),
    ]);

    const myReg = allRegs.find((r) => r.playerId === myPlayer.id);
    const myTeam = myReg?.teamLabel || null;

    const teamGroups: Record<string, { id: string; name: string; position: string | null; school: string; jerseyNumber: string | null; teamLabel: string | null }[]> = {};

    for (const r of allRegs) {
      if (r.player.name === "(탈퇴한 회원)") continue; // 탈퇴 선수 투표 대상 제외
      const key = r.teamLabel || "미배정";
      if (!teamGroups[key]) teamGroups[key] = [];
      teamGroups[key].push({
        id: r.player.id,
        name: r.player.name,
        position: r.player.position,
        school: r.player.school,
        jerseyNumber: r.jerseyNumber,
        teamLabel: r.teamLabel,
      });
    }

    return NextResponse.json({ myPlayerId: myPlayer.id, myTeam, teamGroups, myVotes });
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

    const schedule = await prisma.matchSchedule.findUnique({ where: { id: scheduleId }, select: { status: true } });
    if (!schedule || schedule.status !== "ENDED") {
      return NextResponse.json({ error: "경기가 종료된 후에만 투표할 수 있습니다." }, { status: 403 });
    }

    const myPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
    if (!myPlayer) return NextResponse.json({ error: "선수 프로필 없음" }, { status: 404 });

    if (myPlayer.id === targetId) {
      return NextResponse.json({ error: "자신에게는 투표할 수 없습니다." }, { status: 400 });
    }

    const [myReg, targetReg] = await Promise.all([
      prisma.scheduleRegistration.findUnique({ where: { scheduleId_playerId: { scheduleId, playerId: myPlayer.id } } }),
      prisma.scheduleRegistration.findUnique({ where: { scheduleId_playerId: { scheduleId, playerId: targetId } } }),
    ]);

    if (!myReg || myReg.status === "CANCELLED") {
      return NextResponse.json({ error: "이 경기 참가자만 투표할 수 있습니다." }, { status: 403 });
    }
    if (!targetReg || targetReg.status === "CANCELLED") {
      return NextResponse.json({ error: "해당 선수는 이 경기 참가자가 아닙니다." }, { status: 400 });
    }
    if (myReg.teamLabel && targetReg.teamLabel && myReg.teamLabel !== targetReg.teamLabel) {
      return NextResponse.json({ error: "같은 팀 선수에게만 투표할 수 있습니다." }, { status: 400 });
    }

    const conflictVote = await prisma.playerVote.findFirst({
      where: { scheduleId, voterId: myPlayer.id, targetId, voteType: voteType === "MVP" ? "FAIRPLAY" : "MVP" },
    });
    if (conflictVote) {
      return NextResponse.json({ error: "같은 선수에게 MVP와 페어플레이를 동시에 줄 수 없습니다." }, { status: 400 });
    }

    const vote = await prisma.playerVote.upsert({
      where: { scheduleId_voterId_voteType: { scheduleId, voterId: myPlayer.id, voteType } },
      create: { scheduleId, voterId: myPlayer.id, targetId, voteType },
      update: { targetId },
    });

    // 전원 투표 완료 여부 확인 후 조건 충족 시에만 집계
    await tryAggregateVotes(scheduleId);
    revalidateTag("standings", "default");
    revalidateTag("players-list", "default");

    return NextResponse.json(vote);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
