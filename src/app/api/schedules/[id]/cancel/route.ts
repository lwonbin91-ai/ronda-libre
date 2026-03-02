export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, cancellationMailHtml } from "@/lib/mail";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  try {
    const { reason } = await req.json();

    const schedule = await prisma.matchSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        registrations: {
          include: {
            player: { select: { name: true, parentEmail: true } },
          },
        },
      },
    });
    if (!schedule) return NextResponse.json({ error: "경기 없음" }, { status: 404 });

    await prisma.matchSchedule.update({
      where: { id: scheduleId },
      data: { status: "CANCELLED", cancelReason: reason || "운영상의 사유" },
    });

    // 등록자 이메일 발송
    const emailPromises = schedule.registrations
      .filter((r) => r.player.parentEmail)
      .map((r) =>
        sendMail({
          to: r.player.parentEmail,
          subject: `[Ronda Libre] ${schedule.title} 경기 취소 안내`,
          html: cancellationMailHtml(r.player.name, schedule.title, reason),
        })
      );
    await Promise.allSettled(emailPromises);

    return NextResponse.json({ ok: true, notified: schedule.registrations.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
