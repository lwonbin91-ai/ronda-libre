export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  const user = session.user as { id: string };

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const playerId = formData.get("playerId") as string | null;

    if (!file || !playerId) return NextResponse.json({ error: "파일 또는 playerId 없음" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return NextResponse.json({ error: "jpg/png/webp 파일만 가능합니다." }, { status: 400 });
    }

    const filename = `${playerId}-${Date.now()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
    await writeFile(uploadPath, buffer);

    const photoUrl = `/uploads/${filename}`;
    await prisma.player.update({ where: { id: playerId }, data: { photoUrl } });

    return NextResponse.json({ photoUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
