export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

// 관리자 전용: fee=0인 모든 PENDING 등록을 CONFIRMED으로 일괄 확정
export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const result = await prisma.scheduleRegistration.updateMany({
    where: { status: "PENDING", fee: 0 },
    data: { status: "CONFIRMED", paidAt: new Date() },
  });

  revalidateTag("schedules-list", "default");
  revalidateTag("players-list", "default");

  return NextResponse.json({ ok: true, updated: result.count });
}
