import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type AuthUser = {
  id: string;
  role: string;
  name: string;
  email?: string;
};

export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as AuthUser;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  if (user.role !== "ADMIN") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return user;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}

/**
 * 민감 선수 정보(실명, 학교, 출생연도, 키) 열람 권한 체크
 * - ADMIN: 항상 허용
 * - SCOUT/DIRECTOR: 관리자 승인 + 해당 선수에게 입단 제의 후 수락된 경우만 허용
 * - 그 외: 거부
 */
export async function canViewSensitivePlayerInfo(
  viewer: AuthUser,
  playerId: string
): Promise<boolean> {
  if (viewer.role === "ADMIN") return true;

  if (viewer.role === "SCOUT" || viewer.role === "DIRECTOR") {
    // 해당 선수에게 입단 제의를 보내고 수락된 경우만 민감 정보 열람 허용
    const acceptedOffer = await prisma.recruitmentOffer.findFirst({
      where: {
        scoutId: viewer.id,
        playerId,
        status: "ACCEPTED",
      },
    });
    return !!acceptedOffer;
  }

  return false;
}

export function adminOnly(handler: (user: AuthUser, ...args: unknown[]) => Promise<NextResponse>) {
  return async (...args: unknown[]) => {
    try {
      const user = await requireAdmin();
      return handler(user, ...args);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const status = err.status ?? 403;
      return NextResponse.json({ error: err.message ?? "Forbidden" }, { status });
    }
  };
}
