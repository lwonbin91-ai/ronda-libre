"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calcGrade } from "@/lib/grade";

interface ScheduleReg {
  id: string;
  status: string;
  isMVP: boolean;
  isFairplay: boolean;
  goals: number;
  assists: number;
  schedule: { id: string; type: string } | null;
  team: { id: string; name: string; color: string } | null;
}

interface Player {
  id: string;
  name: string;
  birthYear: number;
  height: number | null;
  school: string;
  position: string | null;
  scheduleRegistrations: ScheduleReg[];
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/players?public=true")
      .then((r) => r.json())
      .then((data) => { setPlayers(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = players.filter(
    (p) =>
      p.name.includes(search) ||
      p.school.includes(search) ||
      (p.position || "").includes(search)
  );

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

      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 학교, 포지션으로 검색..."
          className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-5 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-green-400/60 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-2/3 mb-2" />
              <div className="h-3 bg-white/5 rounded w-1/2 mb-5" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, j) => <div key={j} className="h-12 bg-white/5 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-700">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm">{search ? "검색 결과가 없습니다." : "등록된 시즌 참가 선수가 없습니다."}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player) => {
            const regs = player.scheduleRegistrations;
            const seasonRegs = regs.filter((r) => r.schedule?.type === "SEASON");
            const confirmedRegs = seasonRegs.filter((r) => r.status === "CONFIRMED");
            const confirmedCount = confirmedRegs.length;
            const totalGoals = confirmedRegs.reduce((acc, r) => acc + (r.goals || 0), 0);
            const totalAssists = confirmedRegs.reduce((acc, r) => acc + (r.assists || 0), 0);
            const team = seasonRegs[0]?.team;
            const seasonGrade = calcGrade(regs, "SEASON");
            const openGrade = calcGrade(regs, "OPEN");

            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-6 hover:border-green-400/20 transition-all hover:bg-[#111] group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black group-hover:text-green-400 transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{player.school}</p>
                    <p className="text-gray-700 text-xs mt-0.5">
                      {player.birthYear}년생{player.height ? ` · ${player.height}cm` : ""}
                    </p>
                    {team && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                        <span className="text-xs text-gray-500">{team.name}</span>
                      </div>
                    )}
                  </div>
                  {player.position && (
                    <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded-full font-bold shrink-0">
                      {player.position}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mb-3">
                  <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${seasonGrade.grade.bg} ${seasonGrade.grade.border}`}>
                    <span className="text-sm">{seasonGrade.grade.emoji}</span>
                    <div>
                      <div className={`text-xs font-bold ${seasonGrade.grade.color}`}>{seasonGrade.grade.name}</div>
                      <div className="text-[10px] text-gray-600">시즌</div>
                    </div>
                  </div>
                  <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${openGrade.grade.bg} ${openGrade.grade.border}`}>
                    <span className="text-sm">{openGrade.grade.emoji}</span>
                    <div>
                      <div className={`text-xs font-bold ${openGrade.grade.color}`}>{openGrade.grade.name}</div>
                      <div className="text-[10px] text-gray-600">오픈</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "경기", value: confirmedCount },
                    { label: "총 신청", value: seasonRegs.length },
                    { label: "골", value: totalGoals },
                    { label: "도움", value: totalAssists },
                  ].map((s) => (
                    <div key={s.label} className="bg-black rounded-lg p-3">
                      <div className="text-xl font-black text-white">{s.value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
