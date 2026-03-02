import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const schedules = await prisma.matchSchedule.findMany({
      where: { videoUrl: { not: null } },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        videoTitle: true,
        scheduledAt: true,
        location: true,
        type: true,
        level: true,
        createdAt: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
