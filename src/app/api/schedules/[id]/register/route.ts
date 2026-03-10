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
          registrations: {
            where: { status: { not: "CANCELLED" } },
            select: { isGK: true, player: { select: { position: true } } },
          },
          scheduleTeams: { select: { id: true, maxPlayers: true, _count: { select: { registrations: true } } } },
        },
      }),
      prisma.player.findUnique({ where: { id: playerId }, select: { position: true, yearsExp: true } }),
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

    const isGK = player?.position === "GK" || player?.position === "골키퍼";
    if (isGK && schedule.registrations.filter((r) => r.isGK).length >= schedule.maxGK) {
      return NextResponse.json({ error: `GK 자리가 마감되었습니다. (최대 ${schedule.maxGK}명)` }, { status: 409 });
    }

    // 년차 제한 (GK는 제외, 다른 포지션만 적용)
    if (!isGK && schedule.level && schedule.level !== "ALL") {
      const playerYears = player?.yearsExp ?? null;
      const limitMatch = schedule.level.match(/^U(\d+)$/);
      if (limitMatch && playerYears !== null) {
        const maxYears = parseInt(limitMatch[1]);
        if (playerYears > maxYears) {
          return NextResponse.json(
            { error: `이 경기는 ${maxYears}년차까지 신청 가능합니다. (현재 ${playerYears}년차)` },
            { status: 409 }
          );
        }
      }
    }

    // 포지션별 자리 제한 (GK 제외)
    const POSITION_LIMITS: Record<string, number> = { DF: 4, MF: 3, FW: 3 };
    const pos = player?.position?.toUpperCase();
    if (pos && POSITION_LIMITS[pos] !== undefined) {
      const count = schedule.registrations.filter(
        (r) => r.player?.position?.toUpperCase() === pos
      ).length;
      if (count >= POSITION_LIMITS[pos]) {
        const posName: Record<string, string> = { DF: "수비수(DF)", MF: "미드필더(MF)", FW: "공격수(FW)" };
        return NextResponse.json(
          { error: `${posName[pos]} 자리가 마감되었습니다. (최대 ${POSITION_LIMITS[pos]}명)` },
          { status: 409 }
        );
      }
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
