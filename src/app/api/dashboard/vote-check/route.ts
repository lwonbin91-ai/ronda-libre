export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ scheduleId: null });

  const user = session.user as { id: string };

  const myPlayer = await prisma.player.findFirst({ where: { userId: user.id } });
  if (!myPlayer) return NextResponse.json({ scheduleId: null });

  // 내가 참여한 ENDED 경기 목록 (CONFIRMED만)
  const myRegs = await prisma.scheduleRegistration.findMany({
    where: { playerId: myPlayer.id, status: "CONFIRMED", schedule: { status: "ENDED" } },
    select: { scheduleId: true },
  });

  const scheduleIds = [...new Set(myRegs.map((r) => r.scheduleId))];

  for (const scheduleId of scheduleIds) {
    // 나 외 다른 참가자 수 확인 (2명 미만이면 MVP+페어플레이 불가)
    const otherCount = await prisma.scheduleRegistration.count({
      where: { scheduleId, status: { not: "CANCELLED" }, playerId: { not: myPlayer.id } },
    });
    if (otherCount < 2) continue;

    // 내 투표 확인
    const myVotes = await prisma.playerVote.findMany({
      where: { scheduleId, voterId: myPlayer.id },
    });
    const hasMvp = myVotes.some((v) => v.voteType === "MVP");
    const hasFp = myVotes.some((v) => v.voteType === "FAIRPLAY");

    if (!hasMvp || !hasFp) {
      return NextResponse.json({ scheduleId });
    }
  }

  return NextResponse.json({ scheduleId: null });
}
