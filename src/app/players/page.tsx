import { prisma } from "@/lib/prisma";
import PlayersSearch from "./PlayersSearch";

export const revalidate = 0;

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    where: {
      scheduleRegs: { some: { schedule: { type: "SEASON" } } },
    },
    select: {
      id: true,
      name: true,
      birthYear: true,
      height: true,
      school: true,
      position: true,
      scheduleRegs: {
        select: {
          id: true,
          status: true,
          isMVP: true,
          isFairplay: true,
          goals: true,
          assists: true,
          schedule: { select: { id: true, type: true } },
          team: { select: { id: true, name: true, color: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-12">
        <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">PLAYERS</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">선수 프로필</h1>
        <p className="text-gray-500 text-base">Ronda Libre 시즌 참가 선수들의 경기 기록을 확인하세요.</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/8 bg-white/[0.02]">
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-gray-600">해당 페이지에는 시즌 참가 선수 정보만 표시됩니다.</span>
        </div>
      </div>
      <PlayersSearch players={JSON.parse(JSON.stringify(players))} />
    </div>
  );
}
