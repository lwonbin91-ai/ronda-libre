export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; email?: string };
  const userId = user.id;
  const userEmail = user.email;

  if (!userId && !userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dbUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: userEmail! } });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 플레이어 ID 목록
    const players = await prisma.player.findMany({ where: { userId: dbUser.id }, select: { id: true } });
    const playerIds = players.map(p => p.id);

    if (playerIds.length > 0) {
      // 선수 이름을 "(탈퇴)"로 변경 → 투표 기록 유지, 투표 화면에서 이름으로 식별 불가
      await prisma.player.updateMany({
        where: { id: { in: playerIds } },
        data: { name: "(탈퇴한 회원)", parentPhone: "", parentEmail: "", photoUrl: null },
      });
      await prisma.scheduleRegistration.deleteMany({ where: { playerId: { in: playerIds } } });
      await prisma.recruitmentOffer.deleteMany({ where: { playerId: { in: playerIds } } });
      await prisma.matchPlayerRecord.deleteMany({ where: { playerId: { in: playerIds } } });
    }

    await prisma.recruitmentOffer.deleteMany({ where: { scoutId: dbUser.id } });
    await prisma.account.deleteMany({ where: { userId: dbUser.id } });
    await prisma.session.deleteMany({ where: { userId: dbUser.id } });
    await prisma.user.delete({ where: { id: dbUser.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("탈퇴 오류:", e);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
