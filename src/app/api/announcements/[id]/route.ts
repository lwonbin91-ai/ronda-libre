export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const data = await req.json();
  const a = await prisma.announcement.update({ where: { id }, data });
  return NextResponse.json(a);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
