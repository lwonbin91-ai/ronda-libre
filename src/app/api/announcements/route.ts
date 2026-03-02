import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { title, content, isPinned } = await req.json();
  const a = await prisma.announcement.create({
    data: { title, content, isPinned: !!isPinned, authorId: user.id },
    include: { author: { select: { name: true } } },
  });
  return NextResponse.json(a);
}
