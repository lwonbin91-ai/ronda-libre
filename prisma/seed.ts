import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@liga.com";
  const password = process.argv[3] || "admin1234!";
  const name = process.argv[4] || "관리자";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log(`✓ 기존 계정을 관리자로 업그레이드: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, password: hashed, name, role: "ADMIN" },
  });

  console.log("✓ 관리자 계정 생성 완료");
  console.log(`  이메일: ${email}`);
  console.log(`  비밀번호: ${password}`);
  console.log(`  접속 URL: http://localhost:3000/admin`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
