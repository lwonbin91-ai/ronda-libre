export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    // 보안상 사용자 존재 여부 노출 안 함
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1시간

      await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      await sendMail({
        to: email,
        subject: "[Ronda Libre] 비밀번호 재설정 안내",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;padding:32px;border-radius:16px;">
            <h1 style="color:#4ade80;font-size:24px;margin-bottom:8px;">Ronda Libre</h1>
            <h2 style="font-size:18px;margin-bottom:16px;">비밀번호 재설정</h2>
            <p style="color:#ccc;line-height:1.7;">아래 버튼을 클릭하여 비밀번호를 재설정하세요.<br/>링크는 <b>1시간</b> 동안 유효합니다.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;background:#4ade80;color:#000;font-weight:bold;padding:12px 28px;border-radius:999px;text-decoration:none;">비밀번호 재설정하기</a>
            <p style="color:#555;font-size:12px;">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
