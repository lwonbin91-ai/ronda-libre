export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, confirmationMailHtml } from "@/lib/mail";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const regs = await prisma.scheduleRegistration.findMany({
      where: { scheduleId },
      include: {
        player: {
          select: {
            id: true, name: true, school: true, birthYear: true,
            position: true, parentName: true, parentPhone: true, parentEmail: true, yearsExp: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(regs);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { registrationId, status, isMVP, isFairplay, goals, assists } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      updateData.paidAt = status === "CONFIRMED" ? new Date() : null;
    }
    if (isMVP !== undefined) updateData.isMVP = isMVP;
    if (isFairplay !== undefined) updateData.isFairplay = isFairplay;
    if (goals !== undefined) updateData.goals = goals;
    if (assists !== undefined) updateData.assists = assists;

    const reg = await prisma.scheduleRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        player: { select: { name: true, parentEmail: true } },
        schedule: { select: { title: true, scheduledAt: true } },
      },
    });

    // 확정 시 이메일 알림
    if (status === "CONFIRMED" && reg.player.parentEmail) {
      sendMail({
        to: reg.player.parentEmail,
        subject: `[Ronda Libre] ${reg.schedule.title} 경기 참가 확정 안내`,
        html: confirmationMailHtml(reg.player.name, reg.schedule.title, reg.schedule.scheduledAt),
      });
    }

    return NextResponse.json(reg);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
