export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ALLOWED_SIGNUP_ROLES = ["PLAYER", "SCOUT", "DIRECTOR"] as const;
type AllowedRole = typeof ALLOWED_SIGNUP_ROLES[number];

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, role, organization } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "필수 정보를 입력해주세요." }, { status: 400 });
    }

    // 허용된 역할만 허용 - ADMIN은 회원가입으로 절대 생성 불가
    const safeRole: AllowedRole =
      ALLOWED_SIGNUP_ROLES.includes(role as AllowedRole) ? (role as AllowedRole) : "PLAYER";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone || null,
        role: safeRole,
        organization: organization || null,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
