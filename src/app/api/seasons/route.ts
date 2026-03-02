export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      where: { isActive: true },
      include: { teams: true, _count: { select: { registrations: true } } },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(seasons);
  } catch {
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
    const season = await prisma.season.create({
      data: {
        name: data.name,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        fee: data.fee,
        maxPlayers: data.maxPlayers,
        description: data.description || null,
        teams: {
          create: data.teams?.map((t: { name: string; color: string }) => ({
            name: t.name,
            color: t.color,
          })) || [],
        },
      },
      include: { teams: true },
    });
    return NextResponse.json(season);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
