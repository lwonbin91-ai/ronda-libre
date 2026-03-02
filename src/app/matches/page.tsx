"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Schedule {
  id: string;
  title: string;
  type: string;
  level: string;
  gradeLevel: string;
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

const TYPE_LABEL: Record<string, string> = { SEASON: "시즌 리그", ONEDAY: "오픈 매칭" };
const STATUS_LABEL: Record<string, string> = { RECRUITING: "모집 중", CLOSED: "마감", COMPLETED: "완료" };
const LEVEL_LABEL: Record<string, string> = { ALL: "레벨 무관", U1: "1년 미만", U3: "3년 미만", U5: "5년 미만", U6P: "6년 이상" };
const GRADE_LABEL: Record<string, string> = { ALL: "전체 학년", G12: "초등 1~2학년", G34: "초등 3~4학년", G56: "초등 5~6학년", M1: "중학교 1학년" };

function isSoonOrOpen(s: Schedule) {
  const now = new Date();
  if (s.recruitmentStart && new Date(s.recruitmentStart) > now) return "soon";
  if (s.status === "RECRUITING") return "open";
  return "closed";
}

export default function MatchesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "SEASON" | "ONEDAY">("ALL");

  useEffect(() => {
    fetch("/api/schedules")
      .then((r) => r.json())
      .then((data) => { setSchedules(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const filtered = schedules.filter((s) => filter === "ALL" || s.type === filter);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-green-400 text-[11px] font-bold tracking-[0.2em] uppercase mb-3">경기 신청</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">경기 스케줄</h1>
          <p className="text-gray-600 text-sm">참여하고 싶은 경기를 선택해 신청하세요.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Filter */}
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
              {f === "ALL" ? "전체" : TYPE_LABEL[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-700">
            <p className="text-sm">등록된 경기가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const state = isSoonOrOpen(s);
              const isFull = s._count.registrations >= s.maxPlayers;
              const date = new Date(s.scheduledAt);

              return (
                <Link
                  key={s.id}
                  href={`/matches/${s.id}`}
                  className="group flex items-center gap-5 bg-white/[0.02] border border-white/6 rounded-2xl p-5 hover:border-green-400/25 hover:bg-white/[0.04] transition-all"
                >
                  {/* Date block */}
                  <div className="shrink-0 w-14 text-center bg-black border border-white/8 rounded-xl p-3">
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      {date.toLocaleDateString("ko-KR", { month: "short" })}
                    </div>
                    <div className="text-2xl font-black leading-none mt-0.5">{date.getDate()}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {date.toLocaleDateString("ko-KR", { weekday: "short" })}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        s.type === "SEASON"
                          ? "border-green-400/25 text-green-400/80 bg-green-400/5"
                          : "border-white/10 text-gray-500"
                      }`}>
                        {TYPE_LABEL[s.type]}
                      </span>
                      {s.level && s.level !== "ALL" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/20 text-blue-400/80 bg-blue-400/5">
                          {LEVEL_LABEL[s.level] || s.level}
                        </span>
                      )}
                      {s.gradeLevel && s.gradeLevel !== "ALL" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/20 text-purple-400/80 bg-purple-400/5">
                          {GRADE_LABEL[s.gradeLevel] || s.gradeLevel}
                        </span>
                      )}
                      {s.season && (
                        <span className="text-[10px] text-gray-700">{s.season.name}</span>
                      )}
                    </div>
                    <h3 className="font-black text-base group-hover:text-white transition-colors truncate">{s.title}</h3>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      {s.location && ` · ${s.location}`}
                    </p>
                  </div>

                  {/* Right side */}
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
                    <div className="text-xs text-gray-600">
                      {s._count.registrations}/{s.maxPlayers}명
                    </div>
                    <div className="text-sm font-black text-white mt-1">
                      {s.fee.toLocaleString()}원
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
