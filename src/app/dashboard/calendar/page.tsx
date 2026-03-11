"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Reg {
  id: string;
  status: string;
  teamLabel?: string | null;
  jerseyNumber?: string | null;
  schedule: {
    id: string;
    title: string;
    scheduledAt: string;
    location: string | null;
    gameFormat: string;
    type: string;
    status: string;
  };
  team: { name: string; color: string } | null;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [regs, setRegs] = useState<Reg[]>([]);
  const [votesGiven, setVotesGiven] = useState<Array<{ scheduleId: string; voteType: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const player = data[0];
          const all: Reg[] = (player.scheduleRegs || player.scheduleRegistrations || []);
          setRegs(all.sort((a: Reg, b: Reg) =>
            new Date(a.schedule.scheduledAt).getTime() - new Date(b.schedule.scheduledAt).getTime()
          ));
          setVotesGiven(player.votesGiven || []);
        }
        setLoading(false);
      });
  }, [session]);

  const now = new Date();
  const ended = regs.filter((r) => r.schedule.status === "ENDED");
  const upcoming = regs.filter((r) => r.schedule.status !== "ENDED" && new Date(r.schedule.scheduledAt) >= now);
  const past = regs.filter((r) => r.schedule.status !== "ENDED" && new Date(r.schedule.scheduledAt) < now);

  const hasVotedAll = (scheduleId: string) => {
    const v = votesGiven.filter((v) => v.scheduleId === scheduleId);
    return v.some((v) => v.voteType === "MVP") && v.some((v) => v.voteType === "FAIRPLAY");
  };

  const RegCard = ({ reg }: { reg: Reg }) => {
    const date = new Date(reg.schedule.scheduledAt);
    const isEnded = reg.schedule.status === "ENDED";
    const isPast = !isEnded && date < now;
    return (
      <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
        isEnded ? "bg-purple-900/10 border-purple-400/15" :
        isPast ? "bg-black/20 border-white/4 opacity-60" :
        "bg-[#0d0d0d] border-white/8 hover:border-green-400/25"
      }`}>
        <Link href={`/matches/${reg.schedule.id}`} className="flex gap-4 flex-1 min-w-0">
          <div className="text-center shrink-0 w-12">
            <div className={`text-2xl font-black ${isEnded ? "text-purple-400" : "text-green-400"}`}>
              {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(date).replace("일", "")}
            </div>
            <div className="text-xs text-gray-600">
              {new Intl.DateTimeFormat("ko-KR", { month: "numeric", timeZone: "Asia/Seoul" }).format(date).replace("월", "")}월
            </div>
            <div className="text-[10px] text-gray-700">
              {new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "Asia/Seoul" }).format(date)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                reg.schedule.type === "SEASON"
                  ? "text-green-400 border-green-400/25 bg-green-400/8"
                  : "text-blue-400 border-blue-400/25 bg-blue-400/8"
              }`}>{reg.schedule.type === "SEASON" ? "시즌 리그" : "오픈 매칭"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isEnded ? "text-purple-400 border-purple-400/20 bg-purple-400/8" :
                reg.status === "CONFIRMED" ? "text-green-400 border-green-400/20 bg-green-400/8" :
                "text-yellow-400 border-yellow-400/20 bg-yellow-400/8"
              }`}>{isEnded ? "경기끝" : reg.status === "CONFIRMED" ? "확정" : "대기"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                reg.teamLabel ? "text-orange-300 border-orange-400/30 bg-orange-400/8" : "text-gray-500 border-white/10"
              }`}>{reg.teamLabel || "미배정"}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                reg.jerseyNumber ? "text-blue-300 border-blue-400/30 bg-blue-400/8" : "text-gray-500 border-white/10"
              }`}>{reg.jerseyNumber ? `등번호 : ${reg.jerseyNumber}` : "번호미배정"}</span>
            </div>
            <p className="font-bold text-sm">{reg.schedule.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
              {reg.schedule.location ? ` · ${reg.schedule.location}` : ""}
            </p>
          </div>
        </Link>
        {isEnded && !hasVotedAll(reg.schedule.id) && (
          <Link href={`/dashboard/vote/${reg.schedule.id}`}
            className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1.5 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
            투표하기
          </Link>
        )}
        {isEnded && hasVotedAll(reg.schedule.id) && (
          <span className="text-[10px] font-bold text-gray-600 border border-white/8 px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0">
            투표완료
          </span>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-xs text-gray-600 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors">← 대시보드</Link>
          <div>
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase">CALENDAR</p>
            <h1 className="text-2xl font-black">내 경기 일정</h1>
          </div>
        </div>

        {ended.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-3">경기끝 · 투표 가능 ({ended.length})</p>
            <div className="space-y-3">{ended.map((r) => <RegCard key={r.id} reg={r} />)}</div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-3">다가오는 경기 ({upcoming.length})</p>
            <div className="space-y-3">{upcoming.map((r) => <RegCard key={r.id} reg={r} />)}</div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-3">지난 경기 ({past.length})</p>
            <div className="space-y-3">{past.map((r) => <RegCard key={r.id} reg={r} />)}</div>
          </div>
        )}

        {regs.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="mb-4">신청한 경기가 없습니다.</p>
            <Link href="/matches" className="text-green-400 hover:text-green-300 font-bold text-sm">경기 신청하기 →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
