import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id: string } | undefined;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        scheduleRegs: {
          include: {
            schedule: {
              select: {
                id: true, title: true, scheduledAt: true, gameFormat: true,
                videoUrl: true, videoTitle: true, type: true, level: true, location: true,
              },
            },
            team: { select: { id: true, name: true, color: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        offersReceived: {
          include: { scout: { select: { name: true, organization: true, email: true } } },
        },
      },
    });
    if (!player) return NextResponse.json({ error: "선수를 찾을 수 없습니다." }, { status: 404 });

    return NextResponse.json({
      ...player,
      scheduleRegistrations: player.scheduleRegs,
      isOwn: user ? player.userId === user.id : false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "선수 없음" }, { status: 404 });
    if (existing.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const data = await req.json();
    const player = await prisma.player.update({
      where: { id },
      data: {
        name: data.name,
        birthYear: data.birthYear,
        school: data.school,
        position: data.position || null,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
      },
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "선수 없음" }, { status: 404 });
    if (existing.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const data = await req.json();
    const updateData: Record<string, unknown> = {};
    if (data.height !== undefined) updateData.height = data.height;
    if (data.position !== undefined) updateData.position = data.position;

    const player = await prisma.player.update({ where: { id }, data: updateData });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    await prisma.scheduleRegistration.deleteMany({ where: { playerId: id } });
    await prisma.recruitmentOffer.deleteMany({ where: { playerId: id } });
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
