export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const result = await prisma.scheduleRegistration.updateMany({
    where: { status: { not: "CONFIRMED" }, fee: 0 },
    data: { status: "CONFIRMED", paidAt: new Date() },
  });

  revalidateTag("schedules-list", "default");
  revalidateTag("players-list", "default");

  return NextResponse.json({ ok: true, updated: result.count });
}
