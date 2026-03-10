"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    schedule: { id: string; title: string; type: string; scheduledAt: string };
    team: { name: string; color: string | null } | null;
  }>;
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
  const pendingOffers = players.flatMap((p) => p.offersReceived || []).filter((o) => o.status === "PENDING").length;

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

  const handleOfferResponse = async (offerId: string, status: "ACCEPTED" | "DECLINED") => {
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
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

      {pendingOffers > 0 && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="text-green-400 font-bold">입단 제의 {pendingOffers}건이 도착했습니다!</div>
          <Link href="#offers" className="text-sm text-green-400 hover:underline">확인하기</Link>
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
            const seasonRegs = (player.scheduleRegs || []).filter((r) => r.schedule?.type === "SEASON");
            const confirmedCount = seasonRegs.filter((r) => r.status === "CONFIRMED").length;
            const offers = (player.offersReceived || []).filter((o) => o.status === "PENDING");
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
                            <Link href={`/dashboard/vote/${reg.schedule.id}`}
                              className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                              투표하기
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                            <button onClick={() => handleOfferResponse(offer.id, "ACCEPTED")}
                              className="text-xs bg-green-400 text-black px-3 py-1.5 rounded-full font-bold hover:bg-green-300">수락</button>
                            <button onClick={() => handleOfferResponse(offer.id, "DECLINED")}
                              className="text-xs border border-white/20 text-gray-400 px-3 py-1.5 rounded-full font-bold hover:border-red-400 hover:text-red-400">거절</button>
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
