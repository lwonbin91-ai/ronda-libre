import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { scoreHome, scoreAway } = await req.json();
  const schedule = await prisma.matchSchedule.update({
    where: { id },
    data: {
      scoreHome: scoreHome ?? null,
      scoreAway: scoreAway ?? null,
      status: "COMPLETED",
    },
  });
  return NextResponse.json(schedule);
}
