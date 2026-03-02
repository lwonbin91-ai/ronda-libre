"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TeamStat {
  teamId: string;
  teamName: string;
  color: string;
  scheduleTitle: string;
  players: number;
  goals: number;
  assists: number;
  mvp: number;
  fairplay: number;
}

export default function StandingsPage() {
  const [teams, setTeams] = useState<TeamStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => r.json())
      .then((d) => { setTeams(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">STANDINGS</p>
          <h1 className="text-4xl font-black">시즌 순위표</h1>
          <p className="text-gray-500 text-sm mt-2">시즌 리그 팀별 골·어시스트·MVP 현황</p>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-20 text-gray-600">집계된 순위 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {teams.map((t, i) => (
              <div key={t.teamId} className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  i === 0 ? "bg-yellow-400 text-black" : i === 1 ? "bg-gray-300 text-black" : i === 2 ? "bg-orange-400 text-black" : "bg-white/8 text-gray-400"
                }`}>
                  {i + 1}
                </div>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-base">{t.teamName}</p>
                  <p className="text-xs text-gray-600 truncate">{t.scheduleTitle}</p>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center shrink-0">
                  {[
                    { label: "선수", value: t.players },
                    { label: "골", value: t.goals },
                    { label: "도움", value: t.assists },
                    { label: "MVP", value: t.mvp },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-xl font-black text-green-400">{s.value}</div>
                      <div className="text-[10px] text-gray-600">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
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
