export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const schedule = await prisma.matchSchedule.findUnique({
      where: { id },
      include: {
        season: { select: { name: true } },
        _count: { select: { registrations: true } },
        registrations: {
          where: { status: { not: "CANCELLED" } },
          select: { isGK: true, player: { select: { position: true } } },
        },
        scheduleTeams: {
          select: { id: true, name: true, color: true, maxPlayers: true, _count: { select: { registrations: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!schedule) return NextResponse.json({ error: "없음" }, { status: 404 });

    const isOneday = schedule.type === "ONEDAY";
    const mp = schedule.maxPlayers;

    let POSITION_LIMITS: Record<string, number>;
    if (isOneday) {
      if (mp <= 16) {
        POSITION_LIMITS = { GK: 2, DF: 6, MF: 4, FW: 4 };
      } else {
        POSITION_LIMITS = { GK: 3, DF: 9, MF: 6, FW: 6 };
      }
    } else {
      POSITION_LIMITS = { GK: 1, DF: 4, MF: 3, FW: 3 };
    }
    const positionCounts: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
    const posMap: Record<string, string> = {
      골키퍼: "GK", gk: "GK",
      수비수: "DF", df: "DF",
      미드필더: "MF", mf: "MF",
      공격수: "FW", fw: "FW",
    };
    for (const r of schedule.registrations) {
      let p: string | undefined;
      if (r.isGK) {
        p = "GK";
      } else {
        const raw = r.player?.position || "";
        p = posMap[raw] ?? posMap[raw.toLowerCase()] ?? (["GK","DF","MF","FW"].includes(raw.toUpperCase()) ? raw.toUpperCase() : undefined);
      }
      if (p && p in positionCounts) positionCounts[p]++;
    }
    const positionStatus = Object.fromEntries(
      Object.entries(POSITION_LIMITS).map(([pos, max]) => [
        pos,
        { max, current: positionCounts[pos], full: positionCounts[pos] >= max },
      ])
    );

    return NextResponse.json({ ...schedule, positionStatus });
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
        ...(data.status && {
          status: data.status,
          ...(data.status === "ENDED" && { endedAt: new Date() }),
        }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.videoTitle !== undefined && { videoTitle: data.videoTitle }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.maxPlayers && { maxPlayers: data.maxPlayers }),
        ...(data.fee !== undefined && { fee: data.fee }),
        ...(data.recruitmentStart !== undefined && {
          recruitmentStart: data.recruitmentStart ? new Date(data.recruitmentStart) : null,
          ...(data.recruitmentStart && { scheduledAt: new Date(data.recruitmentStart) }),
        }),
        ...(data.recruitmentEnd !== undefined && {
          recruitmentEnd: data.recruitmentEnd ? new Date(data.recruitmentEnd) : null,
        }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.gameFormat !== undefined && { gameFormat: data.gameFormat }),
        ...(data.gradeLevel !== undefined && { gradeLevel: data.gradeLevel }),
      },
    });
    revalidateTag("schedules-list", "default");
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
    revalidateTag("schedules-list", "default");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
