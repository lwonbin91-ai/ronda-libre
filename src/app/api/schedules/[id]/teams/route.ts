export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teams = await prisma.scheduleTeam.findMany({
    where: { scheduleId: id },
    include: { _count: { select: { registrations: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }
  const { name, color, maxPlayers } = await req.json();
  if (!name) return NextResponse.json({ error: "팀 이름 필요" }, { status: 400 });

  const team = await prisma.scheduleTeam.create({
    data: { scheduleId: id, name, color: color || "#4ade80", maxPlayers: maxPlayers || 10 },
    include: { _count: { select: { registrations: true } } },
  });
  return NextResponse.json(team);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }
  const { teamId } = await req.json();
  await prisma.scheduleTeam.delete({ where: { id: teamId, scheduleId } });
  return NextResponse.json({ ok: true });
}
