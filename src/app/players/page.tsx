import { prisma } from "@/lib/prisma";
import PlayersSearch from "./PlayersSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayersPage() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      name: true,
      birthYear: true,
      height: true,
      school: true,
      position: true,
      scheduleRegs: {
        where: { status: { not: "CANCELLED" } },
        select: {
          isMVP: true,
          isFairplay: true,
          schedule: { select: { type: true } },
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
        <p className="text-gray-500 text-base">Ronda Libre 선수들의 경기 기록을 확인하세요.</p>
      </div>
      <PlayersSearch players={JSON.parse(JSON.stringify(players))} />
    </div>
  );
}
