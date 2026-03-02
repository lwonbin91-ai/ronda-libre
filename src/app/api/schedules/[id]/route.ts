import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const schedule = await prisma.matchSchedule.findUnique({
      where: { id },
      include: {
        season: { select: { name: true } },
        _count: { select: { registrations: true } },
        scheduleTeams: {
          select: { id: true, name: true, color: true, maxPlayers: true, _count: { select: { registrations: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!schedule) return NextResponse.json({ error: "없음" }, { status: 404 });
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const schedule = await prisma.matchSchedule.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.videoTitle !== undefined && { videoTitle: data.videoTitle }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.maxPlayers && { maxPlayers: data.maxPlayers }),
      },
    });
    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }
  try {
    await prisma.scheduleRegistration.deleteMany({ where: { scheduleId: id } });
    await prisma.matchSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
