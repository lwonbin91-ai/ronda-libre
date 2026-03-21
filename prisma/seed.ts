/**
 * Admin seed script
 * 사용법:
 *   npx ts-node --project tsconfig.json -e "require('tsconfig-paths/register')" prisma/seed.ts [이메일] [비밀번호] [이름]
 * 또는:
 *   npm run seed:admin -- admin@example.com MyStr0ngPass! 관리자
 *
 * ⚠️  관리자 계정은 오직 이 스크립트나 DB 콘솔로만 생성 가능합니다.
 *     회원가입 API는 ADMIN 역할 생성을 서버에서 차단합니다.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function validatePassword(pw: string): string | null {
  if (pw.length < 12) return "비밀번호는 12자 이상이어야 합니다.";
  if (!/[A-Z]/.test(pw)) return "대문자를 포함해야 합니다.";
  if (!/[a-z]/.test(pw)) return "소문자를 포함해야 합니다.";
  if (!/[0-9]/.test(pw)) return "숫자를 포함해야 합니다.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "특수문자를 포함해야 합니다.";
  return null;
}

async function main() {
  let email = process.argv[2];
  let password = process.argv[3];
  let name = process.argv[4];

  // 인터랙티브 모드
  if (!email) {
    email = await ask("관리자 이메일: ");
  }
  if (!password) {
    password = await ask("관리자 비밀번호 (12자+, 대소문자+숫자+특수문자): ");
  }
  if (!name) {
    name = await ask("관리자 이름 [관리자]: ") || "관리자";
  }

  // 비밀번호 강도 검사
  const pwError = validatePassword(password);
  if (pwError) {
    console.error(`❌ ${pwError}`);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      console.log(`⚠️  이미 관리자 계정이 존재합니다: ${email}`);
      const confirm = await ask("비밀번호를 재설정하시겠습니까? (y/N): ");
      if (confirm.toLowerCase() !== "y") {
        console.log("취소됨.");
        return;
      }
      const hashed = await bcrypt.hash(password, 14);
      await prisma.user.update({ where: { email }, data: { password: hashed } });
      console.log(`✓ 관리자 비밀번호 재설정 완료: ${email}`);
    } else {
      console.error(`❌ '${email}'은 일반 계정입니다. 관리자로 승격하려면 DB 콘솔을 직접 사용하세요.`);
      process.exit(1);
    }
    return;
  }

  const hashed = await bcrypt.hash(password, 14); // bcrypt cost=14 (admin은 더 강하게)
  await prisma.user.create({
    data: { email, password: hashed, name, role: "ADMIN" },
  });

  console.log("✅ 관리자 계정 생성 완료");
  console.log(`   이메일: ${email}`);
  console.log(`   이름:   ${name}`);
  console.log(`   접속:   /admin`);
  console.log("");
  console.log("⚠️  비밀번호는 안전한 곳에 보관하세요. 이 스크립트 실행 기록에서 삭제하세요.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
