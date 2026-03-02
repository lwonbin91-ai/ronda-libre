export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string };

  try {
    const { playerId, seasonId, teamId, type } = await req.json();

    const existing = await prisma.registration.findFirst({
      where: { playerId, seasonId },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 신청된 시즌입니다." }, { status: 409 });
    }

    const registration = await prisma.registration.create({
      data: {
        playerId,
        seasonId,
        teamId: teamId || null,
        type,
        status: "PENDING",
      },
      include: { season: true, team: true },
    });
    return NextResponse.json(registration);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const where = user.role === "ADMIN" ? {} : { player: { userId: user.id } };
    const regs = await prisma.registration.findMany({
      where,
      include: {
        player: true,
        season: true,
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(regs);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
