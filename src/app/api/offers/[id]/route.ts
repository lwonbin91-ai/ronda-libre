import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const user = session.user as { id: string; role: string };

  try {
    const { status } = await req.json();
    const offer = await prisma.recruitmentOffer.findUnique({ where: { id }, include: { player: true } });
    if (!offer) return NextResponse.json({ error: "제의 없음" }, { status: 404 });

    if (offer.player.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const updated = await prisma.recruitmentOffer.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
