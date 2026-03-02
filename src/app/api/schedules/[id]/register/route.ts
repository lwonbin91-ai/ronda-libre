export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  try {
    const { playerId, teamId } = await req.json();

    const [schedule, player] = await Promise.all([
      prisma.matchSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          _count: { select: { registrations: true } },
          registrations: { where: { isGK: true }, select: { id: true } },
          scheduleTeams: { select: { id: true, maxPlayers: true, _count: { select: { registrations: true } } } },
        },
      }),
      prisma.player.findUnique({ where: { id: playerId }, select: { position: true } }),
    ]);

    if (!schedule) return NextResponse.json({ error: "스케줄 없음" }, { status: 404 });
    if (schedule.status !== "RECRUITING") {
      return NextResponse.json({ error: "모집이 마감되었습니다." }, { status: 409 });
    }
    if (schedule._count.registrations >= schedule.maxPlayers) {
      return NextResponse.json({ error: "정원이 초과되었습니다." }, { status: 409 });
    }

    const now = new Date();
    if (schedule.recruitmentStart && now < schedule.recruitmentStart) {
      return NextResponse.json({ error: "아직 모집 기간이 아닙니다." }, { status: 409 });
    }
    if (schedule.recruitmentEnd && now > schedule.recruitmentEnd) {
      return NextResponse.json({ error: "모집이 마감되었습니다." }, { status: 409 });
    }

    const existing = await prisma.scheduleRegistration.findUnique({
      where: { scheduleId_playerId: { scheduleId, playerId } },
    });
    if (existing) return NextResponse.json({ error: "이미 신청되었습니다." }, { status: 409 });

    const isGK = player?.position === "GK";
    if (isGK && schedule.registrations.length >= schedule.maxGK) {
      return NextResponse.json({ error: `GK 자리가 마감되었습니다. (최대 ${schedule.maxGK}명)` }, { status: 409 });
    }

    // 팀 정원 체크 (시즌제)
    if (teamId) {
      const team = schedule.scheduleTeams.find((t) => t.id === teamId);
      if (!team) return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });
      if (team._count.registrations >= team.maxPlayers) {
        return NextResponse.json({ error: "해당 팀의 자리가 마감되었습니다." }, { status: 409 });
      }
    }

    const fee = isGK ? 0 : schedule.fee;

    const reg = await prisma.scheduleRegistration.create({
      data: { scheduleId, playerId, teamId: teamId || null, isGK, fee, status: isGK ? "CONFIRMED" : "PENDING" },
    });

    return NextResponse.json({ ...reg, isGKFree: isGK });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
