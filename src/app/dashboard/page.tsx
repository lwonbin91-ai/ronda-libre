"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  name: string;
  birthYear: number;
  school: string;
  position: string | null;
  scheduleRegs: Array<{
    id: string;
    status: string;
    isGK: boolean;
    schedule: { id: string; title: string; type: string; scheduledAt: string };
    team: { name: string; color: string | null } | null;
  }>;
  offersReceived: Array<{
    id: string; status: string; clubName: string; message: string;
    scout: { name: string; organization: string | null };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string; name?: string } | undefined;
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/players")
        .then((r) => r.json())
        .then((data) => { setPlayers(Array.isArray(data) ? data : []); setLoading(false); });
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (!session) return null;

  const allRegs = players.flatMap((p) => p.scheduleRegs || []);
  const confirmedRegs = allRegs.filter((r) => r.status === "CONFIRMED");
  const seasonConfirmed = confirmedRegs.filter((r) => r.schedule?.type === "SEASON").length;
  const openConfirmed = confirmedRegs.filter((r) => r.schedule?.type === "ONEDAY").length;
  const pendingOffers = players.flatMap((p) => p.offersReceived || []).filter((o) => o.status === "PENDING").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black">{user?.name}님의 대시보드</h1>
          <p className="text-gray-500 mt-1">나의 경기 기록과 리그 활동을 확인하세요.</p>
        </div>
        <Link
          href="/dashboard/register"
          className={`bg-green-400 text-black px-6 py-3 rounded-full font-black hover:bg-green-300 transition-colors text-sm ${players.length > 0 ? "hidden" : ""}`}
        >
          + 프로필 등록
        </Link>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: "등록 선수", value: players.length },
          { label: "시즌 확정", value: seasonConfirmed },
          { label: "오픈 확정", value: openConfirmed },
          { label: "입단 제의", value: pendingOffers },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-green-400">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 입단 제의 알림 */}
      {pendingOffers > 0 && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="text-green-400 font-bold">입단 제의 {pendingOffers}건이 도착했습니다!</div>
          <Link href="#offers" className="text-sm text-green-400 hover:underline">확인하기</Link>
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/dashboard/calendar" className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-4 hover:border-green-400/20 transition-all group">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">내 경기 일정</div>
          <div className="text-xs text-gray-600 mt-0.5">신청한 경기 캘린더</div>
        </Link>
        <Link href="/standings" className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-4 hover:border-green-400/20 transition-all group">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">시즌 순위표</div>
          <div className="text-xs text-gray-600 mt-0.5">팀별 골·어시스트 현황</div>
        </Link>
      </div>

      {/* 선수 목록 */}
      {players.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-gray-500 mb-4">등록된 프로필이 없습니다.</p>
          <Link
            href="/dashboard/register"
            className="bg-green-400 text-black px-6 py-3 rounded-full font-black hover:bg-green-300 transition-colors text-sm"
          >
            프로필 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {players.map((player) => {
            const seasonRegs = (player.scheduleRegs || []).filter((r) => r.schedule?.type === "SEASON");
            const confirmedCount = seasonRegs.filter((r) => r.status === "CONFIRMED").length;
            const offers = (player.offersReceived || []).filter((o) => o.status === "PENDING");

            return (
              <div key={player.id} className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black">{player.name}</h3>
                    <p className="text-gray-500 text-sm">{player.birthYear}년생 · {player.school} · {player.position || "포지션 미정"}</p>
                  </div>
                  <Link href={`/players/${player.id}`} className="text-sm text-green-400 hover:underline">
                    프로필 보기
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "시즌 경기", value: confirmedCount },
                    { label: "총 신청", value: seasonRegs.length },
                    { label: "입단 제의", value: (player.offersReceived || []).length },
                  ].map((s) => (
                    <div key={s.label} className="bg-black rounded-xl p-3 text-center">
                      <div className="text-xl font-black text-white">{s.value}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* 등록된 경기 */}
                {seasonRegs.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2">시즌 참여</p>
                    <div className="space-y-2">
                      {seasonRegs.map((reg) => (
                        <div key={reg.id} className="flex items-center justify-between gap-2">
                          <span className={`flex-1 text-xs px-3 py-1.5 rounded-full font-medium border ${
                            reg.status === "CONFIRMED"
                              ? "border-green-400/30 text-green-400 bg-green-400/10"
                              : "border-yellow-400/30 text-yellow-400 bg-yellow-400/10"
                          }`}>
                            {reg.schedule.title.slice(0, 14)} {reg.team ? `· ${reg.team.name}` : ""} ({reg.status === "CONFIRMED" ? "확정" : "대기"})
                          </span>
                          {reg.status === "CONFIRMED" && (
                            <Link
                              href={`/dashboard/vote/${reg.schedule.id}`}
                              className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0"
                            >
                              투표하기
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 입단 제의 */}
                {offers.length > 0 && (
                  <div id="offers">
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2">입단 제의</p>
                    {offers.map((offer) => (
                      <div key={offer.id} className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 mb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-green-400">{offer.clubName}</p>
                            <p className="text-sm text-gray-400">{offer.scout.name} ({offer.scout.organization})</p>
                            <p className="text-sm text-gray-300 mt-2">{offer.message}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => fetch(`/api/offers/${offer.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "ACCEPTED" }),
                              }).then(() => window.location.reload())}
                              className="text-xs bg-green-400 text-black px-3 py-1.5 rounded-full font-bold hover:bg-green-300"
                            >
                              수락
                            </button>
                            <button
                              onClick={() => fetch(`/api/offers/${offer.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "DECLINED" }),
                              }).then(() => window.location.reload())}
                              className="text-xs border border-white/20 text-gray-400 px-3 py-1.5 rounded-full font-bold hover:border-red-400 hover:text-red-400"
                            >
                              거절
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
