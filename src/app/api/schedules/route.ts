export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const schedules = await prisma.matchSchedule.findMany({
      where,
      include: {
        _count: { select: { registrations: true } },
        season: { select: { name: true } },
        scheduleTeams: { select: { id: true, name: true, color: true, maxPlayers: true, _count: { select: { registrations: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(schedules);
  } catch (e) {
    console.error("schedules GET error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const schedule = await prisma.matchSchedule.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description || null,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location || null,
        maxPlayers: data.maxPlayers || 20,
        fee: data.fee,
        level: data.level || "ALL",
        gradeLevel: data.gradeLevel || "ALL",
        gameFormat: data.gameFormat || "5v5",
        recruitmentStart: data.recruitmentStart ? new Date(data.recruitmentStart) : null,
        recruitmentEnd: data.recruitmentEnd ? new Date(data.recruitmentEnd) : null,
        status: "RECRUITING",
        seasonId: data.seasonId || null,
      },
      include: { _count: { select: { registrations: true } } },
    });
    revalidateTag("schedules-list");
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
