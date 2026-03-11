import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; email?: string };

  try {
    const dbUser = user.id
      ? await prisma.user.findUnique({ where: { id: user.id } })
      : await prisma.user.findUnique({ where: { email: user.email! } });

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 플레이어 ID 목록
    const players = await prisma.player.findMany({ where: { userId: dbUser.id }, select: { id: true } });
    const playerIds = players.map(p => p.id);

    if (playerIds.length > 0) {
      await prisma.playerVote.deleteMany({ where: { voterId: { in: playerIds } } });
      await prisma.playerVote.deleteMany({ where: { targetId: { in: playerIds } } });
      await prisma.scheduleRegistration.deleteMany({ where: { playerId: { in: playerIds } } });
      await prisma.recruitmentOffer.deleteMany({ where: { playerId: { in: playerIds } } });
      await prisma.matchPlayerRecord.deleteMany({ where: { playerId: { in: playerIds } } });
      await prisma.player.deleteMany({ where: { id: { in: playerIds } } });
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
