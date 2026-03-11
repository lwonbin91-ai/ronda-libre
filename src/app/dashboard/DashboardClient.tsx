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

export default function DashboardClient({ userName, players: initialPlayers }: {
  userName: string;
  players: Player[];
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", birthYear: 2015, school: "", position: "", preferredFoot: "", height: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const allRegs = players.flatMap((p) => p.scheduleRegs || []);
  const confirmedRegs = allRegs.filter((r) => r.status === "CONFIRMED");
  const seasonConfirmed = confirmedRegs.filter((r) => r.schedule?.type === "SEASON").length;
  const openConfirmed = confirmedRegs.filter((r) => r.schedule?.type === "ONEDAY").length;
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
        {/* 등록 선수 - 프로필 링크 */}
        {players.length > 0 ? (
          <Link href={`/players/${players[0].id}`} className="bg-gray-900 rounded-2xl p-6 text-center hover:bg-gray-800 hover:ring-1 hover:ring-green-400/30 transition-all">
            <div className="text-3xl font-black text-green-400">{players.length}</div>
            <div className="text-sm text-gray-500 mt-1">등록 선수</div>
          </Link>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-green-400">0</div>
            <div className="text-sm text-gray-500 mt-1">등록 선수</div>
          </div>
        )}
        {[
          { label: "시즌 확정", value: seasonConfirmed, panel: null as null },
          { label: "오픈 확정", value: openConfirmed, panel: "open" as const },
          { label: "입단 제의", value: pendingOffers, panel: "offers" as const },
        ].map((s) => (
          s.panel ? (
            <button key={s.label} onClick={() => togglePanel(s.panel!)}
              className={`bg-gray-900 rounded-2xl p-6 text-center w-full hover:bg-gray-800 hover:ring-1 hover:ring-green-400/30 transition-all ${activePanel === s.panel ? "ring-1 ring-green-400/40" : ""}`}>
              <div className="text-3xl font-black text-green-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </button>
          ) : (
            <div key={s.label} className="bg-gray-900 rounded-2xl p-6 text-center">
              <div className="text-3xl font-black text-green-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          )
        ))}
      </div>

      {/* 오픈 확정 경기 패널 */}
      {activePanel === "open" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">오픈 확정 경기</p>
          {openRegs.length === 0 ? (
            <p className="text-sm text-gray-600">확정된 오픈 매칭이 없습니다.</p>
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
                      return !fullyVoted ? (
                        <Link href={`/dashboard/vote/${r.schedule.id}`}
                          className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1.5 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                          투표하기
                        </Link>
                      ) : null;
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

      {/* 시즌 경기 패널 */}
      {activePanel === "season" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">시즌 경기 기록</p>
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
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-400/25 text-green-400 bg-green-400/5 shrink-0">시즌</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 매칭 경기 패널 */}
      {activePanel === "match" && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-6">
          <p className="text-sm font-bold text-gray-400 mb-4">매칭 경기 기록</p>
          {scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY" && r.status === "CONFIRMED").length === 0 ? (
            <p className="text-sm text-gray-600">확정된 매칭 경기가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY" && r.status === "CONFIRMED").map((r) => {
                const d = new Date(r.schedule.scheduledAt);
                return (
                  <Link key={r.id} href={`/matches/${r.schedule.id}`}
                    className="flex items-center gap-4 bg-white/[0.02] border border-white/6 rounded-xl p-4 hover:border-orange-400/25 transition-colors">
                    <div className="shrink-0 w-12 text-center">
                      <div className="text-xl font-black text-orange-400">
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
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-500/30 text-orange-400 bg-orange-500/10 shrink-0">매칭</span>
                  </Link>
                );
              })}
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
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">시즌 순위표</div>
          <div className="text-xs text-gray-600 mt-0.5">MVP·페어플레이 순위</div>
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <p className="text-gray-500 mb-4">등록된 프로필이 없습니다.</p>
          <Link href="/dashboard/register"
            className="bg-green-400 text-black px-6 py-3 rounded-full font-black hover:bg-green-300 transition-colors text-sm">
            프로필 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {players.map((player) => {
            const offers = (player.offersReceived || []);
            const isEditing = editingId === player.id;

            return (
              <div key={player.id} className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black">{player.name}</h3>
                    <p className="text-gray-500 text-sm">
                      {player.birthYear}년생 · {player.school}
                      {player.position && ` · ${player.position}`}
                      {player.preferredFoot && ` · ${player.preferredFoot}`}
                      {player.height && ` · ${player.height}cm`}
                      {player.yearsExpCurrent && ` · 경력 ${player.yearsExpCurrent}년`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(player)}
                      className="text-xs border border-white/10 text-gray-400 hover:border-green-400/40 hover:text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isEditing ? "취소" : "✎ 수정"}
                    </button>
                    <Link href={`/players/${player.id}`} className="text-sm text-green-400 hover:underline">
                      프로필 보기
                    </Link>
                  </div>
                </div>

                {/* 프로필 수정 폼 */}
                {isEditing && (
                  <div className="bg-black/40 border border-white/8 rounded-xl p-5 mb-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">프로필 수정</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">이름</label>
                        <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">출생연도</label>
                        <input type="number" min={2005} max={2020} value={editForm.birthYear}
                          onChange={(e) => setEditForm({ ...editForm, birthYear: parseInt(e.target.value) })}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">학교/클럽명</label>
                        <input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">키 (cm)</label>
                        <input type="number" min={100} max={220} value={editForm.height}
                          onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400"
                          placeholder="150" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs text-gray-500 mb-2 block">선호 포지션</label>
                      <div className="flex flex-wrap gap-2">
                        {POSITIONS.map((p) => (
                          <button key={p} type="button"
                            onClick={() => setEditForm({ ...editForm, position: editForm.position === p ? "" : p })}
                            className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                              editForm.position === p ? "bg-green-400 text-black border-green-400" : "border-white/10 text-gray-500 hover:border-white/30"
                            }`}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs text-gray-500 mb-2 block">주사용발</label>
                      <div className="flex flex-wrap gap-2">
                        {FEET.map((f) => (
                          <button key={f} type="button"
                            onClick={() => setEditForm({ ...editForm, preferredFoot: editForm.preferredFoot === f ? "" : f })}
                            className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                              editForm.preferredFoot === f ? "bg-green-400 text-black border-green-400" : "border-white/10 text-gray-500 hover:border-white/30"
                            }`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg mb-4">
                      <span className="text-xs text-gray-500">⚽ 축구 경력</span>
                      <span className="text-xs font-bold text-green-400">{player.yearsExpCurrent}년</span>
                      <span className="text-xs text-gray-700 ml-2">(매년 1월 1일 자동 +1년)</span>
                    </div>
                    <button onClick={() => saveEdit(player.id)} disabled={editLoading}
                      className="bg-green-400 text-black font-black px-5 py-2 rounded-lg text-sm hover:bg-green-300 transition-colors disabled:opacity-50">
                      {editLoading ? "저장 중..." : "저장하기"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: "시즌 경기", value: player.scheduleRegs.filter((r) => r.schedule?.type === "SEASON" && r.status === "CONFIRMED").length, panel: "season" as const },
                    { label: "매칭 경기", value: player.scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY" && r.status === "CONFIRMED").length, panel: "match" as const },
                    { label: "입단 제의", value: (player.offersReceived || []).length, panel: "offers" as const },
                  ].map((s) => (
                    <button key={s.label} onClick={() => togglePlayerPanel(player.id, s.panel)}
                      className={`bg-black/40 rounded-xl p-4 text-center w-full hover:bg-black/60 transition-colors ${playerCardPanel[player.id] === s.panel ? "ring-1 ring-green-400/40" : ""}`}>
                      <div className="text-2xl font-black text-green-400">{s.value}</div>
                      <div className="text-xs text-gray-600 mt-1">{s.label}</div>
                    </button>
                  ))}
                </div>

                {/* 시즌 경기 드롭다운 */}
                {playerCardPanel[player.id] === "season" && (
                  <div className="mt-3 bg-black/20 border border-white/6 rounded-xl p-3 space-y-2">
                    {player.scheduleRegs.filter((r) => r.schedule?.type === "SEASON").length === 0 ? (
                      <p className="text-xs text-gray-600">시즌 경기 기록이 없습니다.</p>
                    ) : player.scheduleRegs.filter((r) => r.schedule?.type === "SEASON").map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between gap-2">
                        <span className={`flex-1 text-xs px-3 py-1.5 rounded-full font-medium border ${
                          reg.status === "CONFIRMED"
                            ? "border-green-400/30 text-green-400 bg-green-400/10"
                            : "border-yellow-400/30 text-yellow-400 bg-yellow-400/10"
                        }`}>
                          {reg.schedule.title.slice(0, 14)} {reg.team ? `· ${reg.team.name}` : ""} ({reg.status === "CONFIRMED" ? "확정" : "대기"})
                        </span>
                        {reg.schedule.status === "ENDED" && (
                          <Link href={`/dashboard/vote/${reg.schedule.id}`}
                            className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                            투표하기
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 매칭 경기 드롭다운 */}
                {playerCardPanel[player.id] === "match" && (
                  <div className="mt-3 bg-black/20 border border-white/6 rounded-xl p-3 space-y-2">
                    {player.scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY" && r.status === "CONFIRMED").length === 0 ? (
                      <p className="text-xs text-gray-600">매칭 경기 기록이 없습니다.</p>
                    ) : player.scheduleRegs.filter((r) => r.schedule?.type === "ONEDAY" && r.status === "CONFIRMED").map((reg) => {
                      const d = new Date(reg.schedule.scheduledAt);
                      return (
                        <Link key={reg.id} href={`/matches/${reg.schedule.id}`}
                          className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/6 rounded-lg hover:border-orange-400/25 transition-colors">
                          <div className="text-sm font-black text-orange-400 w-10 text-center shrink-0">
                            {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "")}일
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-blue-400 border-blue-400/25 bg-blue-400/8">오픈 매칭</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${reg.schedule.status === "ENDED" ? "text-purple-400 border-purple-400/20 bg-purple-400/8" : "text-green-400 border-green-400/20 bg-green-400/8"}`}>
                                {reg.schedule.status === "ENDED" ? "경기끝" : "확정"}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${reg.teamLabel ? "text-orange-300 border-orange-400/30" : "text-gray-600 border-white/10"}`}>
                                {reg.teamLabel || "미배정"}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${reg.jerseyNumber ? "text-blue-300 border-blue-400/30" : "text-gray-600 border-white/10"}`}>
                                {reg.jerseyNumber ? `등번호 : ${reg.jerseyNumber}` : "번호미배정"}
                              </span>
                            </div>
                            <p className="text-xs font-bold truncate">{reg.schedule.title}</p>
                            <p className="text-[10px] text-gray-600">{d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}</p>
                          </div>
                          {reg.schedule.status === "ENDED" && (
                            <Link href={`/dashboard/vote/${reg.schedule.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                              투표하기
                            </Link>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* 입단 제의 드롭다운 */}
                {playerCardPanel[player.id] === "offers" && (
                  <div className="mt-3 bg-black/20 border border-white/6 rounded-xl p-3 space-y-2" id="offers">
                    {offers.length === 0 ? (
                      <p className="text-xs text-gray-600">받은 입단 제의가 없습니다.</p>
                    ) : offers.map((offer) => (
                      <div key={offer.id} className={`border rounded-xl p-4 ${
                        offer.status === "ACCEPTED" ? "bg-green-400/5 border-green-400/15" :
                        offer.status === "DECLINED" ? "bg-white/[0.02] border-white/6 opacity-50" :
                        "bg-green-400/10 border-green-400/20"
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-green-400">{offer.clubName}</p>
                              {offer.status === "ACCEPTED" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400/15 text-green-400 border border-green-400/20">수락됨</span>}
                              {offer.status === "DECLINED" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/10">거절됨</span>}
                            </div>
                            <p className="text-sm text-gray-400">{offer.scout.name} ({offer.scout.organization})</p>
                            <p className="text-sm text-gray-300 mt-2">{offer.message}</p>
                          </div>
                          {offer.status === "PENDING" && (
                            <div className="flex gap-2 ml-4 shrink-0">
                              <button onClick={() => handleOfferResponse(offer.id, "ACCEPTED")}
                                className="text-xs bg-green-400 text-black px-3 py-1.5 rounded-full font-bold hover:bg-green-300">수락</button>
                              <button onClick={() => handleOfferResponse(offer.id, "DECLINED")}
                                className="text-xs border border-white/20 text-gray-400 px-3 py-1.5 rounded-full font-bold hover:border-red-400 hover:text-red-400">거절</button>
                            </div>
                          )}
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
