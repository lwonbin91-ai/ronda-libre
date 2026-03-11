"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Player {
  id: string;
  name: string;
  birthYear: number;
  school: string;
  position: string | null;
  preferredFoot: string | null;
  height: number | null;
  yearsExpCurrent: number | null;
  scheduleRegs: Array<{
    id: string;
    status: string;
    isGK: boolean;
    teamLabel?: string | null;
    jerseyNumber?: string | null;
    schedule: { id: string; title: string; type: string; scheduledAt: string; location?: string | null; status: string };
    team: { name: string; color: string | null } | null;
  }>;
  votesGiven?: Array<{ scheduleId: string; voteType: string }>;
  offersReceived: Array<{
    id: string; status: string; clubName: string; message: string;
    scout: { name: string; organization: string | null };
  }>;
}

interface EditForm {
  name: string;
  birthYear: number;
  school: string;
  position: string;
  preferredFoot: string;
  height: string;
}

const POSITIONS = ["골키퍼", "수비수", "미드필더", "공격수"];
const FEET = ["오른발", "왼발", "양발"];

export default function DashboardClient({ userName, players: initialPlayers, initialPendingVotes = [] }: {
  userName: string;
  players: Player[];
  initialPendingVotes?: { scheduleId: string; title: string }[];
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", birthYear: 2015, school: "", position: "", preferredFoot: "", height: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const allRegs = players.flatMap((p) => p.scheduleRegs || []);
  const activeRegs = allRegs.filter((r) => r.status !== "CANCELLED");
  const confirmedRegs = allRegs.filter((r) => r.status === "CONFIRMED");
  const seasonConfirmed = activeRegs.filter((r) => r.schedule?.type === "SEASON").length;
  const openConfirmed = activeRegs.filter((r) => r.schedule?.type === "ONEDAY").length;
  const pendingOffers = players.flatMap((p) => p.offersReceived || []).length;

  const startEdit = (player: Player) => {
    setEditForm({
      name: player.name,
      birthYear: player.birthYear,
      school: player.school,
      position: player.position || "",
      preferredFoot: player.preferredFoot || "",
      height: player.height ? String(player.height) : "",
    });
    setEditingId(player.id);
  };

  const saveEdit = async (playerId: string) => {
    setEditLoading(true);
    const res = await fetch(`/api/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        birthYear: editForm.birthYear,
        school: editForm.school,
        position: editForm.position || null,
        preferredFoot: editForm.preferredFoot || null,
        height: editForm.height ? parseInt(editForm.height) : null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, ...updated } : p));
      setEditingId(null);
    }
    setEditLoading(false);
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pendingVotes, setPendingVotes] = useState<{ scheduleId: string; title: string }[]>(initialPendingVotes ?? []);

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/users/me", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    }
  };

  const handleOfferResponse = async (offerId: string, status: "ACCEPTED" | "DECLINED") => {
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  const scheduleRegs = players.flatMap((p) => p.scheduleRegs || []);
  const openRegs = confirmedRegs.filter((r) => r.schedule?.type === "ONEDAY");
  const allOffers = players.flatMap((p) => p.offersReceived || []);
  const matchRegs = scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY");
  const [activePanel, setActivePanel] = useState<"open" | "offers" | "season" | "match" | null>(null);
  const [playerCardPanel, setPlayerCardPanel] = useState<Record<string, "season" | "match" | "offers" | null>>({});

  const togglePanel = (panel: "open" | "offers" | "season" | "match") => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const togglePlayerPanel = (playerId: string, panel: "season" | "match" | "offers") => {
    setPlayerCardPanel((prev) => ({ ...prev, [playerId]: prev[playerId] === panel ? null : panel }));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      {/* 미투표 알림 팝업 */}
      {pendingVotes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="font-black text-lg mb-2">경기가 종료되었습니다.</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              아래 경기의 MVP와 페어플레이 투표를 완료해주세요.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {pendingVotes.map((v) => (
                <Link
                  key={v.scheduleId}
                  href={`/dashboard/vote/${v.scheduleId}`}
                  onClick={() => setPendingVotes((prev) => prev.filter((p) => p.scheduleId !== v.scheduleId))}
                  className="w-full bg-purple-500 text-white py-2.5 rounded-xl text-sm font-black hover:bg-purple-400 transition-colors"
                >
                  {v.title} 투표하기
                </Link>
              ))}
            </div>
            <button
              onClick={() => setPendingVotes([])}
              className="w-full border border-white/10 text-gray-500 py-2.5 rounded-xl text-sm font-bold hover:border-white/20 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black">{userName}님의 대시보드</h1>
          <p className="text-gray-500 mt-1">나의 경기 기록과 리그 활동을 확인하세요.</p>
        </div>
        {players.length === 0 && (
          <Link href="/dashboard/register"
            className="bg-green-400 text-black px-6 py-3 rounded-full font-black hover:bg-green-300 transition-colors text-sm">
            + 프로필 등록
          </Link>
        )}
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {/* 프로필 카드 */}
        {players.length > 0 ? (
          <Link href={`/players/${players[0].id}`} className="bg-gray-900 rounded-2xl p-6 text-center hover:bg-gray-800 hover:ring-1 hover:ring-green-400/30 transition-all">
            <div className="text-3xl font-black text-green-400">👤</div>
            <div className="text-sm text-gray-500 mt-1">프로필</div>
          </Link>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 text-center opacity-50">
            <div className="text-3xl font-black text-green-400">👤</div>
            <div className="text-sm text-gray-500 mt-1">프로필</div>
          </div>
        )}
        {[
          { label: "시즌 경기", value: seasonConfirmed, panel: "season" as const },
          { label: "매칭 경기", value: openConfirmed, panel: "open" as const },
          { label: "입단 제의", value: pendingOffers, panel: "offers" as const },
        ].map((s) => (
          <button key={s.label} onClick={() => togglePanel(s.panel)}
            className={`bg-gray-900 rounded-2xl p-6 text-center w-full hover:bg-gray-800 hover:ring-1 hover:ring-green-400/30 transition-all ${activePanel === s.panel ? "ring-1 ring-green-400/40" : ""}`}>
            <div className="text-3xl font-black text-green-400">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* 시즌 경기 패널 */}
      {activePanel === "season" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">시즌 경기</p>
          {scheduleRegs.filter((r) => r.schedule?.type === "SEASON" && r.status === "CONFIRMED").length === 0 ? (
            <p className="text-sm text-gray-600">확정된 시즌 경기가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {scheduleRegs.filter((r) => r.schedule?.type === "SEASON" && r.status === "CONFIRMED").map((r) => {
                const d = new Date(r.schedule.scheduledAt);
                return (
                  <Link key={r.id} href={`/matches/${r.schedule.id}`}
                    className="flex items-center gap-4 bg-white/[0.02] border border-white/6 rounded-xl p-4 hover:border-green-400/25 transition-colors">
                    <div className="shrink-0 w-12 text-center">
                      <div className="text-xl font-black text-green-400">
                        {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "")}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {new Intl.DateTimeFormat("ko-KR", { month: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("월", "")}월
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{r.schedule.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
                        {r.schedule.location && ` · ${r.schedule.location}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 매칭 경기 패널 */}
      {activePanel === "open" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">매칭 경기</p>
          {openRegs.length === 0 ? (
            <p className="text-sm text-gray-600">확정된 매칭 경기가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {openRegs.map((r) => {
                const d = new Date(r.schedule.scheduledAt);
                return (
                  <Link key={r.id} href={`/matches/${r.schedule.id}`}
                    className="flex items-center gap-4 bg-white/[0.02] border border-white/6 rounded-xl p-4 hover:border-green-400/25 transition-colors">
                    <div className="shrink-0 w-12 text-center">
                      <div className="text-xl font-black text-green-400">
                        {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "")}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {new Intl.DateTimeFormat("ko-KR", { month: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("월", "")}월
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border text-blue-400 border-blue-400/25 bg-blue-400/8">오픈 매칭</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.schedule.status === "ENDED" ? "text-purple-400 border-purple-400/20 bg-purple-400/8" : "text-green-400 border-green-400/20 bg-green-400/8"}`}>
                          {r.schedule.status === "ENDED" ? "경기끝" : "확정"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.teamLabel ? "text-orange-300 border-orange-400/30 bg-orange-400/8" : "text-gray-500 border-white/10"}`}>
                          {r.teamLabel || "미배정"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.jerseyNumber ? "text-blue-300 border-blue-400/30 bg-blue-400/8" : "text-gray-500 border-white/10"}`}>
                          {r.jerseyNumber ? `등번호 : ${r.jerseyNumber}` : "번호미배정"}
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate">{r.schedule.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}
                        {r.schedule.location && ` · ${r.schedule.location}`}
                      </p>
                    </div>
                    {r.schedule.status === "ENDED" && (() => {
                      const votesDone = (players[0]?.votesGiven || []).filter((v) => v.scheduleId === r.schedule.id);
                      const fullyVoted = votesDone.some((v) => v.voteType === "MVP") && votesDone.some((v) => v.voteType === "FAIRPLAY");
                      return fullyVoted ? (
                        <Link href={`/dashboard/vote/${r.schedule.id}`}
                          className="text-[10px] font-bold text-green-400 border border-green-400/20 bg-green-400/5 px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0">
                          ✓ 투표완료
                        </Link>
                      ) : (
                        <Link href={`/dashboard/vote/${r.schedule.id}`}
                          className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1.5 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                          투표하기
                        </Link>
                      );
                    })()}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 입단 제의 패널 */}
      {activePanel === "offers" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">입단 제의</p>
          {allOffers.length === 0 ? (
            <p className="text-sm text-gray-600">받은 입단 제의가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {allOffers.map((offer) => (
                <div key={offer.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">{offer.clubName}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{offer.message}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                      offer.status === "ACCEPTED" ? "border-green-400/25 text-green-400 bg-green-400/5"
                      : offer.status === "REJECTED" ? "border-red-400/25 text-red-400"
                      : "border-yellow-400/25 text-yellow-400"
                    }`}>
                      {offer.status === "ACCEPTED" ? "수락" : offer.status === "REJECTED" ? "거절" : "대기 중"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/dashboard/calendar" className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-4 hover:border-green-400/20 transition-all group">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">내 경기 일정</div>
          <div className="text-xs text-gray-600 mt-0.5">신청한 경기 캘린더</div>
        </Link>
        <Link href="/standings" className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-4 hover:border-green-400/20 transition-all group">
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">순위표</div>
          <div className="text-xs text-gray-600 mt-0.5">MVP·페어플레이 순위</div>
        </Link>
      </div>

      {players.length === 0 && (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-gray-500 mb-4">등록된 프로필이 없습니다.</p>
          <Link href="/dashboard/register"
            className="bg-green-400 text-black px-6 py-3 rounded-full font-black hover:bg-green-300 transition-colors text-sm">
            프로필 등록하기
          </Link>
        </div>
      )}

      {/* 회원 탈퇴 */}
      <div className="mt-16 pt-8 border-t border-white/5">
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)}
            className="text-xs text-gray-700 hover:text-red-400 transition-colors">
            회원 탈퇴
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
            <p className="text-sm font-bold text-red-400 mb-1">정말 탈퇴하시겠습니까?</p>
            <p className="text-xs text-gray-500 mb-4">계정과 모든 프로필 정보가 삭제되며 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount}
                className="text-xs bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                탈퇴 확인
              </button>
              <button onClick={() => setDeleteConfirm(false)}
                className="text-xs border border-white/10 text-gray-500 px-4 py-2 rounded-lg hover:border-white/25">
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
