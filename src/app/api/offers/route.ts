import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const where = user.role === "SCOUT" || user.role === "ADMIN"
      ? {}
      : { scoutId: user.id };

    const offers = await prisma.recruitmentOffer.findMany({
      where,
      include: {
        scout: { select: { name: true, organization: true, email: true } },
        player: { select: { name: true, school: true, birthYear: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(offers);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;
  if (!session || (user?.role !== "SCOUT" && user?.role !== "ADMIN")) {
    return NextResponse.json({ error: "스카우터만 입단 제의 가능합니다." }, { status: 403 });
  }

  try {
    const { playerId, message, clubName } = await req.json();

    const existing = await prisma.recruitmentOffer.findFirst({
      where: { scoutId: user!.id, playerId, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 진행 중인 제의가 있습니다." }, { status: 409 });
    }

    const offer = await prisma.recruitmentOffer.create({
      data: { scoutId: user!.id, playerId, message, clubName },
      include: {
        scout: { select: { name: true, organization: true } },
        player: { select: { name: true } },
      },
    });
    return NextResponse.json(offer);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
