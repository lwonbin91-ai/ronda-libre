import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 0;

export default async function StandingsPage() {
  const players = await prisma.player.findMany({
    where: {
      scheduleRegs: {
        some: { schedule: { type: "SEASON" }, status: "CONFIRMED" },
      },
    },
    select: {
      id: true,
      name: true,
      position: true,
      school: true,
      birthYear: true,
      scheduleRegs: {
        where: { schedule: { type: "SEASON" }, status: "CONFIRMED" },
        select: { isMVP: true, isFairplay: true },
      },
      votesReceived: { select: { voteType: true } },
    },
  });

  const result = players
    .map((p) => {
      const mvpVotes = p.votesReceived.filter((v) => v.voteType === "MVP").length;
      const fairplayVotes = p.votesReceived.filter((v) => v.voteType === "FAIRPLAY").length;
      const mvpAward = p.scheduleRegs.filter((r) => r.isMVP).length;
      const fairplayAward = p.scheduleRegs.filter((r) => r.isFairplay).length;
      const totalMVP = mvpVotes + mvpAward;
      const totalFairplay = fairplayVotes + fairplayAward;
      const totalGames = p.scheduleRegs.length;
      return {
        id: p.id, name: p.name, position: p.position, school: p.school,
        birthYear: p.birthYear, mvp: totalMVP, fairplay: totalFairplay,
        games: totalGames, score: totalMVP * 2 + totalFairplay,
      };
    })
    .filter((p) => p.games > 0)
    .sort((a, b) => b.score - a.score || b.mvp - a.mvp || b.fairplay - a.fairplay);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">STANDINGS</p>
          <h1 className="text-4xl font-black">시즌 순위표</h1>
          <p className="text-gray-500 text-sm mt-2">MVP·페어플레이를 가장 많이 받은 선수 순위입니다.</p>
        </div>

        <div className="flex items-center gap-4 mb-6 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="text-yellow-400 font-black">★</span> MVP 1회 = 2점</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-400 font-black">♥</span> 페어플레이 1회 = 1점</span>
        </div>

        {result.length === 0 ? (
          <div className="text-center py-20 text-gray-600">집계된 순위 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {result.map((p, i) => (
              <Link key={p.id} href={`/players/${p.id}`}>
                <div className={`border rounded-2xl p-4 flex items-center gap-4 hover:border-green-400/20 transition-all cursor-pointer ${
                  i === 0 ? "bg-yellow-400/5 border-yellow-400/20" :
                  i === 1 ? "bg-gray-400/5 border-gray-400/15" :
                  i === 2 ? "bg-orange-400/5 border-orange-400/15" :
                  "bg-[#0d0d0d] border-white/6"
                }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    i === 0 ? "bg-yellow-400 text-black" :
                    i === 1 ? "bg-gray-300 text-black" :
                    i === 2 ? "bg-orange-400 text-black" :
                    "bg-white/8 text-gray-400"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm">{p.name}</p>
                      {p.position && (
                        <span className="text-[10px] border border-white/10 text-gray-500 px-1.5 py-0.5 rounded">{p.position}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{p.school} · {p.birthYear}년생 · {p.games}경기</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-black text-yellow-400">{p.mvp}</div>
                      <div className="text-[10px] text-gray-600">MVP</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-black text-blue-400">{p.fairplay}</div>
                      <div className="text-[10px] text-gray-600">페어플레이</div>
                    </div>
                    <div className="text-center min-w-[36px]">
                      <div className="text-lg font-black text-green-400">{p.score}</div>
                      <div className="text-[10px] text-gray-600">점수</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-gray-600 hover:text-white border border-white/8 px-4 py-2 rounded-lg transition-colors">
            ← 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
