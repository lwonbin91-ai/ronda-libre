export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const playerListSelect = {
  id: true, name: true, birthYear: true, height: true, school: true,
  position: true, preferredFoot: true, yearsExp: true,
  scheduleRegs: {
    where: { status: { not: "CANCELLED" } },
    select: {
      id: true, status: true, isMVP: true, isFairplay: true, goals: true, assists: true,
      teamLabel: true, jerseyNumber: true,
      schedule: { select: { id: true, title: true, scheduledAt: true, gameFormat: true, videoUrl: true, videoTitle: true, type: true, status: true, location: true } },
      team: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const publicOnly = searchParams.get("public") === "true";

  // 비로그인도 public 조회 허용 - 전체 선수
  if (publicOnly || !session) {
    try {
      const players = await prisma.player.findMany({
        select: playerListSelect,
        orderBy: { name: "asc" },
      });
      return NextResponse.json(players.map((p) => ({ ...p, scheduleRegistrations: p.scheduleRegs })));
    } catch (e) {
      console.error("players GET public error:", e);
      return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
  }

  const user = session.user as { id: string; role: string };

  try {
    if (user.role === "SCOUT" || user.role === "ADMIN") {
      const players = await prisma.player.findMany({
        select: {
          ...playerListSelect,
          offersReceived: {
            select: { id: true, status: true, clubName: true, scout: { select: { name: true, organization: true } } },
          },
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(players);
    }

    const players = await prisma.player.findMany({
      where: { userId: user.id },
      select: {
        ...playerListSelect,
        offersReceived: {
          select: { id: true, status: true, clubName: true, message: true, scout: { select: { name: true, organization: true } } },
        },
        votesGiven: { select: { scheduleId: true, voteType: true } },
      },
    });
    return NextResponse.json(players);
  } catch (e) {
    console.error("players GET error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string };

  try {
    const existing = await prisma.player.findFirst({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: "이미 선수 프로필이 등록되어 있습니다. 계정당 1개만 등록 가능합니다." }, { status: 409 });
    }

    const data = await req.json();
    const yearsExpVal = data.yearsExp ? parseInt(data.yearsExp) : null;
    const currentYear = new Date().getFullYear();
    const yearsExpStartYear = yearsExpVal ? currentYear - yearsExpVal : null;
    const player = await prisma.player.create({
      data: {
        name: data.name,
        birthYear: data.birthYear,
        height: data.height ? parseInt(data.height) : null,
        school: data.school,
        position: data.position || null,
        preferredFoot: data.preferredFoot || null,
        yearsExp: yearsExpVal,
        yearsExpStartYear,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        userId: user.id,
      },
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
