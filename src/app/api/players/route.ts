export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canViewSensitivePlayerInfo } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

// 공개 가능한 필드만 포함 (민감 정보 제외)
const publicPlayerSelect = {
  id: true,
  position: true,
  preferredFoot: true,
  yearsExp: true,
  scheduleRegs: {
    where: { status: { not: "CANCELLED" } },
    select: {
      id: true, status: true, isMVP: true, isFairplay: true, goals: true, assists: true,
      teamLabel: true, jerseyNumber: true,
      schedule: { select: { id: true, title: true, scheduledAt: true, gameFormat: true, videoUrl: true, videoTitle: true, type: true, status: true, location: true } },
      team: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

// 민감 정보 포함 필드 (권한 확인 후만 사용)
const sensitiveFields = {
  name: true,
  birthYear: true,
  height: true,
  school: true,
};

export async function GET(req: NextRequest) {
  const viewer = await getSessionUser();

  try {
    const players = await prisma.player.findMany({
      select: {
        ...publicPlayerSelect,
        // 민감 필드는 항상 가져오되 응답 시 필터링
        name: true,
        birthYear: true,
        height: true,
        school: true,
        userId: true,
      },
      orderBy: { name: "asc" },
    });

    // 각 선수별로 민감 정보 접근 권한 계산
    const result = await Promise.all(
      players.map(async (p) => {
        const isOwnProfile = viewer?.id && p.userId === viewer.id;
        const canViewSensitive =
          isOwnProfile ||
          (viewer ? await canViewSensitivePlayerInfo(viewer, p.id) : false);

        const base = {
          id: p.id,
          position: p.position,
          preferredFoot: p.preferredFoot,
          yearsExp: p.yearsExp,
          scheduleRegs: p.scheduleRegs,
          scheduleRegistrations: p.scheduleRegs,
        };

        if (canViewSensitive) {
          return {
            ...base,
            name: p.name,
            birthYear: p.birthYear,
            height: p.height,
            school: p.school,
          };
        }

        // 공개용: 이름은 성+* 마스킹, 나머지 민감 정보 숨김
        const maskedName = p.name
          ? p.name.charAt(0) + "*".repeat(Math.max(p.name.length - 1, 1))
          : "익명";

        return {
          ...base,
          name: maskedName,
          birthYear: null,
          height: null,
          school: null,
        };
      })
    );

    // 본인 프로필 조회 시 추가 정보 포함
    if (viewer && viewer.role !== "ADMIN") {
      const ownPlayer = await prisma.player.findFirst({
        where: { userId: viewer.id },
        select: {
          ...publicPlayerSelect,
          ...sensitiveFields,
          offersReceived: {
            select: { id: true, status: true, clubName: true, message: true, scout: { select: { name: true, organization: true } } },
          },
          votesGiven: { select: { scheduleId: true, voteType: true } },
        },
      });
      if (ownPlayer) {
        const idx = result.findIndex((r) => r.id === ownPlayer.id);
        if (idx !== -1) {
          result[idx] = {
            ...result[idx],
            name: ownPlayer.name,
            birthYear: ownPlayer.birthYear,
            height: ownPlayer.height,
            school: ownPlayer.school,
            // @ts-expect-error extended fields
            offersReceived: ownPlayer.offersReceived,
            votesGiven: ownPlayer.votesGiven,
          };
        }
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("players GET error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getSessionUser();
  if (!viewer) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  // role, isAdmin 등 권한 필드는 클라이언트 입력 무시 (mass assignment 방지)
  const ALLOWED_FIELDS = ["name", "birthYear", "height", "school", "position", "preferredFoot", "yearsExp", "parentName", "parentPhone", "parentEmail"] as const;

  try {
    const existing = await prisma.player.findFirst({ where: { userId: viewer.id } });
    if (existing) {
      return NextResponse.json({ error: "이미 선수 프로필이 등록되어 있습니다." }, { status: 409 });
    }

    const raw = await req.json();
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in raw) data[key] = raw[key];
    }

    const yearsExpVal = data.yearsExp ? parseInt(data.yearsExp as string) : null;
    const currentYear = new Date().getFullYear();
    const yearsExpStartYear = yearsExpVal ? currentYear - yearsExpVal : null;

    const player = await prisma.player.create({
      data: {
        name: data.name as string,
        birthYear: data.birthYear ? parseInt(data.birthYear as string) : 0,
        height: data.height ? parseInt(data.height as string) : null,
        school: (data.school as string) || "",
        position: (data.position as string) || null,
        preferredFoot: (data.preferredFoot as string) || null,
        yearsExp: yearsExpVal,
        yearsExpStartYear,
        parentName: (data.parentName as string) || "",
        parentPhone: (data.parentPhone as string) || "",
        parentEmail: (data.parentEmail as string) || "",
        userId: viewer.id,
      },
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
