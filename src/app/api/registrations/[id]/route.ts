export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      data.status = body.status;
      data.paidAt = body.status === "CONFIRMED" ? new Date() : null;
    }
    if (body.teamLabel !== undefined) data.teamLabel = body.teamLabel || null;
    const reg = await prisma.registration.update({ where: { id }, data });
    return NextResponse.json(reg);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
