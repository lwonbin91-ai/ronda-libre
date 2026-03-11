"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Reg {
  id: string;
  status: string;
  teamLabel?: string | null;
  schedule: {
    id: string;
    title: string;
    scheduledAt: string;
    location: string | null;
    gameFormat: string;
    type: string;
  };
  team: { name: string; color: string } | null;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [regs, setRegs] = useState<Reg[]>([]);
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
        }
        setLoading(false);
      });
  }, [session]);

  const now = new Date();
  const upcoming = regs.filter((r) => new Date(r.schedule.scheduledAt) >= now);
  const past = regs.filter((r) => new Date(r.schedule.scheduledAt) < now);

  const RegCard = ({ reg }: { reg: Reg }) => {
    const date = new Date(reg.schedule.scheduledAt);
    const isPast = date < now;
    return (
      <Link href={`/matches/${reg.schedule.id}`} className={`flex gap-4 p-4 rounded-2xl border transition-all ${
        isPast ? "bg-black/20 border-white/4 opacity-60" : "bg-[#0d0d0d] border-white/8 hover:border-green-400/25 hover:bg-white/[0.03]"
      }`}>
        <div className="text-center shrink-0 w-14">
          <div className="text-2xl font-black text-green-400">
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
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              reg.schedule.type === "SEASON"
                ? "text-green-400 border-green-400/25 bg-green-400/8"
                : "text-blue-400 border-blue-400/25 bg-blue-400/8"
            }`}>{reg.schedule.type === "SEASON" ? "시즌 리그" : "오픈 매칭"}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              reg.status === "CONFIRMED"
                ? "text-green-400 border-green-400/20 bg-green-400/8"
                : "text-yellow-400 border-yellow-400/20 bg-yellow-400/8"
            }`}>{reg.status === "CONFIRMED" ? "확정" : "대기"}</span>
            {reg.status === "CONFIRMED" && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                reg.teamLabel
                  ? "text-orange-300 border-orange-400/30 bg-orange-400/8"
                  : "text-gray-500 border-white/10"
              }`}>
                {reg.teamLabel || "미배정"}
              </span>
            )}
          </div>
          <p className="font-bold text-sm">{reg.schedule.title}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
            {reg.schedule.location ? ` · ${reg.schedule.location}` : ""}
            {reg.team ? ` · ${reg.team.name}` : ""}
          </p>
        </div>
      </Link>
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
