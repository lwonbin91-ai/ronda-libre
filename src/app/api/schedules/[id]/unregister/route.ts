export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

// 선수 본인이 자신의 등록을 취소 (경기 이틀 전까지만 가능, KST 기준)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const { playerId } = await req.json();

    // 선수가 본인 플레이어인지 확인
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { userId: true },
    });
    if (!player || player.userId !== user.id) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    // 경기 정보 조회
    const schedule = await prisma.matchSchedule.findUnique({
      where: { id: scheduleId },
      select: { scheduledAt: true, status: true, type: true },
    });
    if (!schedule) return NextResponse.json({ error: "경기 없음" }, { status: 404 });

    // 오픈 매칭만 취소 가능
    if (schedule.type !== "ONEDAY") {
      return NextResponse.json({ error: "오픈 매칭만 취소 가능합니다." }, { status: 400 });
    }

    // 경기가 이미 종료/취소된 경우
    if (schedule.status === "ENDED" || schedule.status === "CANCELLED") {
      return NextResponse.json({ error: "종료되거나 취소된 경기입니다." }, { status: 400 });
    }

    // 한국 시간 기준 이틀 전 데드라인 계산
    // KST = UTC+9
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000;

    // 경기 시작 시각을 KST Date로 변환
    const schedAt = new Date(schedule.scheduledAt);

    // KST 기준 경기 날짜의 00:00:00
    const schedKstMs = schedAt.getTime() + KST_OFFSET;
    const schedKstDay = Math.floor(schedKstMs / (24 * 60 * 60 * 1000));

    // 현재 KST 날짜
    const nowKstMs = now.getTime() + KST_OFFSET;
    const nowKstDay = Math.floor(nowKstMs / (24 * 60 * 60 * 1000));

    // 이틀 전: schedKstDay - 2 >= nowKstDay 이어야 취소 가능
    // 즉 경기 날 - 현재 날 >= 2 이어야 함
    const daysUntilMatch = schedKstDay - nowKstDay;
    if (daysUntilMatch < 2) {
      return NextResponse.json(
        { error: "경기 이틀 전까지만 취소 가능합니다. (한국 시간 기준)" },
        { status: 400 }
      );
    }

    // 등록 확인
    const reg = await prisma.scheduleRegistration.findUnique({
      where: { scheduleId_playerId: { scheduleId, playerId } },
    });
    if (!reg || reg.status === "CANCELLED") {
      return NextResponse.json({ error: "신청 내역이 없습니다." }, { status: 404 });
    }

    // 취소 처리
    await prisma.scheduleRegistration.update({
      where: { scheduleId_playerId: { scheduleId, playerId } },
      data: { status: "CANCELLED" },
    });

    revalidateTag("schedules-list", "default");
    revalidateTag("players-list", "default");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
