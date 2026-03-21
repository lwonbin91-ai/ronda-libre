import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewSensitivePlayerInfo } from "@/lib/authz";
import PlayersSearch from "./PlayersSearch";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  const viewer = session?.user as { id: string; role: string } | undefined;

  const rawPlayers = await prisma.player.findMany({
    select: {
      id: true, name: true, birthYear: true, height: true, school: true,
      position: true, preferredFoot: true, yearsExp: true, userId: true,
      scheduleRegs: {
        where: { status: "CONFIRMED", schedule: { status: "ENDED" } },
        select: { status: true, isMVP: true, isFairplay: true, goals: true, assists: true, schedule: { select: { type: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const players = await Promise.all(
    rawPlayers.map(async (p) => {
      const isOwn = viewer?.id === p.userId;
      const canView = isOwn || (viewer ? await canViewSensitivePlayerInfo(viewer as Parameters<typeof canViewSensitivePlayerInfo>[0], p.id) : false);

      return {
        id: p.id,
        position: p.position,
        preferredFoot: p.preferredFoot,
        yearsExp: p.yearsExp,
        scheduleRegs: p.scheduleRegs,
        name: canView ? p.name : (p.name ? p.name.charAt(0) + "*".repeat(Math.max(p.name.length - 1, 1)) : "익명"),
        birthYear: canView ? p.birthYear : null,
        height: canView ? p.height : null,
        school: canView ? p.school : null,
      };
    })
  );

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
