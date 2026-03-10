"use client";

import { useState } from "react";
import Link from "next/link";

interface Schedule {
  id: string;
  title: string;
  type: string;
  level: string;
  gradeLevel: string;
  gameFormat: string | null;
  description: string | null;
  scheduledAt: string;
  location: string | null;
  maxPlayers: number;
  fee: number;
  recruitmentStart: string | null;
  recruitmentEnd: string | null;
  status: string;
  season: { name: string } | null;
  _count: { registrations: number };
}

function isSoonOrOpen(s: Schedule) {
  const now = new Date();
  if (s.recruitmentStart && new Date(s.recruitmentStart) > now) return "soon";
  if (s.status === "RECRUITING") return "open";
  return "closed";
}

export default function MatchesFilter({
  schedules,
  typeLabel,
  levelLabel,
  gradeLabel,
}: {
  schedules: Schedule[];
  typeLabel: Record<string, string>;
  levelLabel: Record<string, string>;
  gradeLabel: Record<string, string>;
}) {
  const [filter, setFilter] = useState<"ALL" | "SEASON" | "ONEDAY">("ALL");
  const filtered = schedules.filter((s) => filter === "ALL" || s.type === filter);

  return (
    <>
      <div className="flex gap-2 mb-8">
        {(["ALL", "SEASON", "ONEDAY"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f
                ? "bg-white text-black"
                : "border border-white/10 text-gray-500 hover:border-white/25 hover:text-white"
            }`}
          >
            {f === "ALL" ? "전체" : typeLabel[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-700">
          <p className="text-sm">등록된 경기가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const state = isSoonOrOpen(s);
            const isFull = s._count.registrations >= s.maxPlayers;
            const date = new Date(s.scheduledAt);
            const TZ = { timeZone: "Asia/Seoul" } as const;

            return (
              <Link
                key={s.id}
                href={`/matches/${s.id}`}
                className="group flex items-center gap-5 bg-white/[0.02] border border-white/6 rounded-2xl p-5 hover:border-green-400/25 hover:bg-white/[0.04] transition-all"
              >
                <div className="shrink-0 w-14 text-center bg-black border border-white/8 rounded-xl p-3">
                  <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    {date.toLocaleDateString("ko-KR", { month: "short", ...TZ })}
                  </div>
                  <div className="text-2xl font-black leading-none mt-0.5">
                    {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(date).replace("일", "")}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {date.toLocaleDateString("ko-KR", { weekday: "short", ...TZ })}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.type === "SEASON"
                        ? "border-green-400/25 text-green-400/80 bg-green-400/5"
                        : "border-white/10 text-gray-500"
                    }`}>
                      {typeLabel[s.type]}
                    </span>
                    {s.level && s.level !== "ALL" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/20 text-blue-400/80 bg-blue-400/5">
                        {levelLabel[s.level] || s.level}
                      </span>
                    )}
                    {s.gradeLevel && s.gradeLevel !== "ALL" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/20 text-purple-400/80 bg-purple-400/5">
                        {gradeLabel[s.gradeLevel] || s.gradeLevel}
                      </span>
                    )}
                    {s.gameFormat && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-400/20 text-gray-400/80 bg-gray-400/5">
                        {s.gameFormat.replace("v", " vs ")}
                      </span>
                    )}
                    {s.season && (
                      <span className="text-[10px] text-gray-700">{s.season.name}</span>
                    )}
                  </div>
                  <h3 className="font-black text-base group-hover:text-white transition-colors truncate">{s.title}</h3>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
                    {s.location && ` · ${s.location}`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <div className={`text-xs font-bold px-3 py-1 rounded-full mb-2 ${
                    s.status === "COMPLETED"
                      ? "bg-white/5 text-gray-600"
                      : isFull
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : state === "soon"
                      ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                      : state === "open"
                      ? "bg-green-400/10 text-green-400 border border-green-400/20"
                      : "bg-white/5 text-gray-600"
                  }`}>
                    {s.status === "COMPLETED" ? "완료" : isFull ? "마감" : state === "soon" ? "오픈 예정" : "모집 중"}
                  </div>
                  <div className="text-xs text-gray-600">{s._count.registrations}/{s.maxPlayers}명</div>
                  <div className="text-sm font-black text-white mt-1">{s.fee.toLocaleString()}원</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
