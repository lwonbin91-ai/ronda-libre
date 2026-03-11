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

    await prisma.scheduleRegistration.deleteMany({ where: { player: { userId: dbUser.id } } });
    await prisma.playerVote.deleteMany({ where: { voterId: dbUser.id } });
    await prisma.recruitmentOffer.deleteMany({ where: { scoutId: dbUser.id } });
    await prisma.player.deleteMany({ where: { userId: dbUser.id } });
    await prisma.user.delete({ where: { id: dbUser.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("탈퇴 오류:", e);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
