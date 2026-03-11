import { prisma } from "@/lib/prisma";
import Link from "next/link";
import MatchesFilter from "./MatchesFilter";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getSchedules = unstable_cache(
  () => prisma.matchSchedule.findMany({
    include: {
      season: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { scheduledAt: "asc" },
  }),
  ["schedules-list"],
  { tags: ["schedules-list"], revalidate: 30 }
);

const TYPE_LABEL: Record<string, string> = { SEASON: "시즌 리그", ONEDAY: "오픈 매칭" };
const LEVEL_LABEL: Record<string, string> = {
  ALL: "레벨 무관",
  U1: "1년차까지", U2: "2년차까지", U3: "3년차까지", U4: "4년차까지", U5: "5년차까지",
  U6: "6년차까지", U7: "7년차까지", U8: "8년차까지", U9: "9년차까지", U10: "10년차까지",
};
const GRADE_LABEL: Record<string, string> = { ALL: "전체 학년", G12: "초등 1~2학년", G34: "초등 3~4학년", G45: "초등 4~5학년", G56: "초등 5~6학년", M1: "중학교 1학년" };

export interface Schedule {
  id: string;
  title: string;
  type: string;
  level: string;
  gradeLevel: string;
  description: string | null;
  scheduledAt: Date;
  location: string | null;
  maxPlayers: number;
  fee: number;
  recruitmentStart: Date | null;
  recruitmentEnd: Date | null;
  status: string;
  season: { name: string } | null;
  _count: { registrations: number };
}

export default async function MatchesPage() {
  const schedules = await getSchedules();

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-green-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-3">경기 신청</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">경기 스케줄</h1>
          <p className="text-gray-600 text-sm">참여하고 싶은 경기를 선택해 신청하세요.</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <MatchesFilter
          schedules={JSON.parse(JSON.stringify(schedules))}
          typeLabel={TYPE_LABEL}
          levelLabel={LEVEL_LABEL}
          gradeLabel={GRADE_LABEL}
        />
      </div>
    </div>
  );
}
