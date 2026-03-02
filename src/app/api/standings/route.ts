export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.scheduleTeam.findMany({
      include: {
        schedule: { select: { title: true, type: true } },
        registrations: {
          where: { status: "CONFIRMED" },
          select: { goals: true, assists: true, isMVP: true, isFairplay: true },
        },
      },
    });

    const result = teams
      .filter((t) => t.schedule.type === "SEASON")
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        color: t.color,
        scheduleTitle: t.schedule.title,
        players: t.registrations.length,
        goals: t.registrations.reduce((acc, r) => acc + (r.goals || 0), 0),
        assists: t.registrations.reduce((acc, r) => acc + (r.assists || 0), 0),
        mvp: t.registrations.filter((r) => r.isMVP).length,
        fairplay: t.registrations.filter((r) => r.isFairplay).length,
      }))
      .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
