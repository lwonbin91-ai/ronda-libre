import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
