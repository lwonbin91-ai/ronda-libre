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

    // 투표 기록 보존을 위해 선수 정보만 익명화
    await prisma.player.updateMany({
      where: { userId: dbUser.id },
      data: { name: "(탈퇴한 회원)", parentPhone: "", parentEmail: "", photoUrl: null },
    });

    // User 삭제 → onDelete: Cascade로 연관 account/session 자동 삭제
    await prisma.user.delete({ where: { id: dbUser.id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("탈퇴 오류:", e);
    return NextResponse.json({ error: "탈퇴 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
