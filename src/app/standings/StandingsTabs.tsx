"use client";

import { useState } from "react";
import Link from "next/link";

const POS_CODE: Record<string, string> = { 골키퍼: "GK", 수비수: "DF", 미드필더: "MF", 공격수: "FW" };

interface RankEntry {
  id: string; name: string; position: string | null;
  school: string; birthYear: number;
  mvp: number; fairplay: number; games: number; score: number;
}

function RankList({ ranking, emptyMsg }: { ranking: RankEntry[]; emptyMsg: string }) {
  if (ranking.length === 0) {
    return <div className="text-center py-20 text-gray-600 text-sm">{emptyMsg}</div>;
  }
  return (
    <div className="space-y-3">
      {ranking.map((p, i) => (
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
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-sm truncate">{p.name}</p>
                </div>
                {p.position && (
                  <span className="text-[10px] border border-white/10 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap w-fit mt-0.5">
                    {POS_CODE[p.position] || p.position}
                  </span>
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
              <div className="text-center">
                <div className="text-lg font-black text-orange-400">{p.games}</div>
                <div className="text-[10px] text-gray-600">참여</div>
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
  );
}

export default function StandingsTabs({
  seasonRanking, openRanking,
}: {
  seasonRanking: RankEntry[];
  openRanking: RankEntry[];
}) {
  const [tab, setTab] = useState<"season" | "open">("open");

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">STANDINGS</p>
          <h1 className="text-4xl font-black">순위표</h1>
          <p className="text-gray-500 text-sm mt-2">MVP·페어플레이·참여 점수를 합산한 선수 순위입니다.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {([
            { key: "season", label: "시즌 순위표" },
            { key: "open", label: "매칭 순위표" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                tab === key
                  ? "bg-white text-black"
                  : "border border-white/10 text-gray-500 hover:border-white/25 hover:text-white"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="text-yellow-400 font-black">★</span> MVP 1회 = 3점</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-400 font-black">♥</span> 페어플레이 1회 = 2점</span>
          <span className="flex items-center gap-1.5"><span className="text-orange-400 font-black">●</span> 매칭 참여 1회 = 1점</span>
        </div>
        <div className="mb-6 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed">
          <p className="font-bold text-gray-400 mb-1.5">🏆 MVP · 페어플레이 부여 방식</p>
          <p>팀 내에서 가장 많은 투표를 받은 선수에게 MVP 또는 페어플레이가 부여됩니다.</p>
          <p className="mt-1.5 text-gray-600">
            예시) 선수A: 3표 · 선수B: 2표 · 선수C: 1표 · 선수D: 2표
            → 가장 많은 표를 받은 <span className="text-yellow-400 font-bold">선수A</span>에게 MVP 부여
          </p>
          <p className="mt-1 text-gray-600">동률인 경우 해당 선수 모두에게 부여됩니다.</p>
        </div>

        {tab === "season"
          ? <RankList ranking={seasonRanking} emptyMsg="시즌 순위 데이터가 없습니다." />
          : <RankList ranking={openRanking} emptyMsg="매칭 순위 데이터가 없습니다." />
        }

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-gray-600 hover:text-white border border-white/8 px-4 py-2 rounded-lg transition-colors">
            ← 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
