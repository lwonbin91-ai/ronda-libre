import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "유효하지 않거나 만료된 링크입니다." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email: record.email }, data: { password: hashed } });
    await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
