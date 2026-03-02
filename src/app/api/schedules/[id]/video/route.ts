import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const { videoUrl, videoTitle } = await req.json();
    const schedule = await prisma.matchSchedule.update({
      where: { id: scheduleId },
      data: { videoUrl, videoTitle: videoTitle || null },
    });
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
