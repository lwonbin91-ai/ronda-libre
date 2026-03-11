export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function runVoteAggregation(scheduleId: string) {
  const regs = await prisma.scheduleRegistration.findMany({
    where: { scheduleId, status: { not: "CANCELLED" } },
    select: { id: true, playerId: true, teamLabel: true },
  });

  const teamMap: Record<string, typeof regs> = {};
  for (const r of regs) {
    const key = r.teamLabel || "none";
    if (!teamMap[key]) teamMap[key] = [];
    teamMap[key].push(r);
  }

  for (const teamRegs of Object.values(teamMap)) {
    const playerIds = teamRegs.map((r) => r.playerId);

    const [mvpVotes, fairplayVotes] = await Promise.all([
      prisma.playerVote.groupBy({
        by: ["targetId"],
        where: { scheduleId, targetId: { in: playerIds }, voteType: "MVP" },
        _count: { targetId: true },
        orderBy: { _count: { targetId: "desc" } },
      }),
      prisma.playerVote.groupBy({
        by: ["targetId"],
        where: { scheduleId, targetId: { in: playerIds }, voteType: "FAIRPLAY" },
        _count: { targetId: true },
        orderBy: { _count: { targetId: "desc" } },
      }),
    ]);

    const topMvpPlayerId = mvpVotes[0]?.targetId;
    const topFairplayPlayerId = fairplayVotes[0]?.targetId;

    await prisma.scheduleRegistration.updateMany({
      where: { id: { in: teamRegs.map((r) => r.id) } },
      data: { isMVP: false, isFairplay: false },
    });

    if (topMvpPlayerId) {
      const reg = teamRegs.find((r) => r.playerId === topMvpPlayerId);
      if (reg) await prisma.scheduleRegistration.update({ where: { id: reg.id }, data: { isMVP: true } });
    }
    if (topFairplayPlayerId) {
      const reg = teamRegs.find((r) => r.playerId === topFairplayPlayerId);
      if (reg) await prisma.scheduleRegistration.update({ where: { id: reg.id }, data: { isFairplay: true } });
    }
  }
}

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

    return NextResponse.json({
      myPlayerId: myPlayer.id,
      myTeam,
      teamGroups,
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
      prisma.scheduleRegistration.findUnique({
        where: { scheduleId_playerId: { scheduleId, playerId: myPlayer.id } },
      }),
      prisma.scheduleRegistration.findUnique({
        where: { scheduleId_playerId: { scheduleId, playerId: targetId } },
      }),
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

    const otherVoteType = voteType === "MVP" ? "FAIRPLAY" : "MVP";
    const conflictVote = await prisma.playerVote.findFirst({
      where: { scheduleId, voterId: myPlayer.id, targetId, voteType: otherVoteType },
    });
    if (conflictVote) {
      return NextResponse.json({ error: "같은 선수에게 MVP와 페어플레이를 동시에 줄 수 없습니다." }, { status: 400 });
    }

    const vote = await prisma.playerVote.upsert({
      where: { scheduleId_voterId_voteType: { scheduleId, voterId: myPlayer.id, voteType } },
      create: { scheduleId, voterId: myPlayer.id, targetId, voteType },
      update: { targetId },
    });

    await runVoteAggregation(scheduleId);

    return NextResponse.json(vote);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
