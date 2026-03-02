import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  try {
    const { url, title, isPublic } = await req.json();
    const video = await prisma.matchVideo.create({
      data: { matchId, url, title: title || null, isPublic: isPublic ?? false },
    });
    return NextResponse.json(video);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
