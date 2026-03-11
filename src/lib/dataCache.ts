import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// ── 선수 목록 (선수 페이지) ─────────────────────────────
export const getCachedPlayers = unstable_cache(
  async () =>
    prisma.player.findMany({
      select: {
        id: true, name: true, birthYear: true, height: true, school: true,
        position: true,
        scheduleRegs: {
          where: { status: "CONFIRMED", schedule: { status: "ENDED" } },
          select: { status: true, isMVP: true, isFairplay: true, goals: true, assists: true, schedule: { select: { type: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ["players-list"],
  { tags: ["players-list"], revalidate: 300 }
);

// ── 경기 목록 (matches 페이지) ─────────────────────────
export const getCachedSchedules = unstable_cache(
  async () =>
    prisma.matchSchedule.findMany({
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true, title: true, type: true, level: true, gameFormat: true,
        location: true, scheduledAt: true, maxPlayers: true,
        status: true, gradeLevel: true,
        registrations: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, playerId: true, status: true },
        },
      },
    }),
  ["schedules-list"],
  { tags: ["schedules-list"], revalidate: 60 }
);

// ── 공지사항 목록 ──────────────────────────────────────
export const getCachedAnnouncements = unstable_cache(
  async () =>
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { author: { select: { name: true } } },
    }),
  ["announcements"],
  { tags: ["announcements"], revalidate: 120 }
);

// ── 경기 영상 목록 ─────────────────────────────────────
export const getCachedVideos = unstable_cache(
  async () =>
    prisma.matchSchedule.findMany({
      where: { videoUrl: { not: null } },
      orderBy: { scheduledAt: "desc" },
      select: { id: true, title: true, type: true, level: true, gameFormat: true, scheduledAt: true, videoUrl: true, videoTitle: true },
    }),
  ["videos"],
  { tags: ["videos"], revalidate: 300 }
);

// ── 순위표 ─────────────────────────────────────────────
// 참여 점수는 status=CONFIRMED + schedule.status=ENDED 인 경기만 카운트
export const getCachedStandingsPlayers = unstable_cache(
  async () => {
    const [season, open] = await Promise.all([
      prisma.player.findMany({
        where: { scheduleRegs: { some: { schedule: { type: "SEASON", status: "ENDED" }, status: "CONFIRMED" } } },
        select: {
          id: true, name: true, position: true, school: true, birthYear: true,
          scheduleRegs: { where: { schedule: { type: "SEASON", status: "ENDED" }, status: "CONFIRMED" }, select: { isMVP: true, isFairplay: true } },
        },
      }),
      prisma.player.findMany({
        where: { scheduleRegs: { some: { schedule: { type: "ONEDAY", status: "ENDED" }, status: "CONFIRMED" } } },
        select: {
          id: true, name: true, position: true, school: true, birthYear: true,
          scheduleRegs: { where: { schedule: { type: "ONEDAY", status: "ENDED" }, status: "CONFIRMED" }, select: { isMVP: true, isFairplay: true } },
        },
      }),
    ]);
    return { season, open };
  },
  ["standings"],
  { tags: ["standings"], revalidate: 120 }
);
