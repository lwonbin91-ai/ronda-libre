"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { use } from "react";
import Link from "next/link";
import { calcGrade } from "@/lib/grade";

const LEVEL_LABEL: Record<string, string> = {
  ALL: "레벨 무관", U1: "1년 미만", U3: "3년 미만", U5: "5년 미만", U6P: "6년 이상",
};

interface ScheduleReg {
  id: string;
  status: string;
  isGK: boolean;
  isMVP: boolean;
  isFairplay: boolean;
  goals: number;
  assists: number;
  createdAt: string;
  team: { id: string; name: string; color: string } | null;
  schedule: {
    id: string;
    title: string;
    scheduledAt: string;
    gameFormat: string;
    videoUrl: string | null;
    videoTitle: string | null;
    type: string;
    level: string;
    location: string | null;
  };
}

interface Player {
  id: string;
  name: string;
  birthYear: number;
  height: number | null;
  school: string;
  position: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  isOwn: boolean;
  scheduleRegistrations: ScheduleReg[];
  offersReceived: Array<{
    id: string; status: string; clubName: string; message: string;
    scout: { name: string; organization: string | null };
  }>;
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState({ clubName: "", message: "" });
  const [offerSent, setOfferSent] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [editingHeight, setEditingHeight] = useState(false);
  const [heightValue, setHeightValue] = useState("");

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => r.json())
      .then((data) => { setPlayer(data.id ? data : null); setLoading(false); });
  }, [id]);

  const sendOffer = async () => {
    setOfferError("");
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, ...offerForm }),
    });
    if (res.ok) { setOfferSent(true); }
    else { const data = await res.json(); setOfferError(data.error || "오류 발생"); }
  };

  const saveHeight = async () => {
    const h = parseInt(heightValue);
    if (!h || h < 100 || h > 220) return;
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ height: h }),
    });
    if (res.ok) {
      setPlayer((p) => p ? { ...p, height: h } : p);
      setEditingHeight(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>;
  }
  if (!player) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">선수를 찾을 수 없습니다.</div>;
  }

  const seasonRegs = player.scheduleRegistrations.filter((r) => r.schedule.type === "SEASON");
  const confirmedRegs = seasonRegs.filter((r) => r.status === "CONFIRMED");
  const totalGoals = confirmedRegs.reduce((acc, r) => acc + (r.goals || 0), 0);
  const totalAssists = confirmedRegs.reduce((acc, r) => acc + (r.assists || 0), 0);
  const mvpCount = confirmedRegs.filter((r) => r.isMVP).length;
  const fairplayCount = confirmedRegs.filter((r) => r.isFairplay).length;
  const isScout = user?.role === "SCOUT" || user?.role === "ADMIN";
  const isOwner = player.isOwn;
  const allRegs = player.scheduleRegistrations;
  const seasonGrade = calcGrade(allRegs, "SEASON");
  const openGrade = calcGrade(allRegs, "OPEN");

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{player.name}</h1>
              {player.position && (
                <span className="bg-green-400/10 text-green-400 border border-green-400/20 text-sm px-3 py-1 rounded-full font-bold">
                  {player.position}
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2 flex-wrap">
              <span>{player.school} · {player.birthYear}년생</span>
              {player.height ? (
                <span className="flex items-center gap-1">
                  · {player.height}cm
                  {isOwner && (
                    <button onClick={() => { setHeightValue(String(player.height)); setEditingHeight(true); }}
                      className="text-[10px] text-gray-600 hover:text-green-400 ml-1">✎</button>
                  )}
                </span>
              ) : (
                isOwner && !editingHeight && (
                  <button onClick={() => { setHeightValue(""); setEditingHeight(true); }}
                    className="text-[10px] text-green-400/70 hover:text-green-400 border border-green-400/20 px-2 py-0.5 rounded">+ 키 입력</button>
                )
              )}
            </p>
            {editingHeight && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number" min={100} max={220}
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-sm w-24 text-white focus:outline-none focus:border-green-400"
                  placeholder="cm"
                  autoFocus
                />
                <button onClick={saveHeight} className="text-xs bg-green-400 text-black font-bold px-3 py-1.5 rounded-lg">저장</button>
                <button onClick={() => setEditingHeight(false)} className="text-xs text-gray-600 hover:text-white">취소</button>
              </div>
            )}
          </div>
          <Link href="/players"
            className="text-xs text-gray-600 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors">
            ← 목록
          </Link>
        </div>

        {/* Stats - 시즌제 경기 기준 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
          {[
            { label: "시즌 경기", value: confirmedRegs.length },
            { label: "총 신청", value: seasonRegs.length },
            { label: "골", value: totalGoals },
            { label: "어시스트", value: totalAssists },
            { label: "포지션", value: player.position || "-" },
            { label: "팀", value: seasonRegs[0]?.team?.name || "-" },
          ].map((s) => (
            <div key={s.label} className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-green-400">{s.value}</div>
              <div className="text-xs text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 등급 뱃지 */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { label: "시즌 리그", ...seasonGrade },
            { label: "오픈 매칭", ...openGrade },
          ].map((g) => (
            <div key={g.label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${g.grade.bg} ${g.grade.border}`}>
              <span className="text-xl">{g.grade.emoji}</span>
              <div>
                <div className={`font-black text-sm ${g.grade.color}`}>{g.grade.name}</div>
                <div className="text-[10px] text-gray-600">{g.label} · {g.score}점</div>
              </div>
            </div>
          ))}

          {/* MVP / 페어플레이 수신 */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${mvpCount > 0 ? "bg-yellow-400/10 border-yellow-400/25" : "bg-white/[0.02] border-white/8"}`}>
            <span className="text-xl">⭐</span>
            <div>
              <div className={`font-black text-sm ${mvpCount > 0 ? "text-yellow-300" : "text-gray-600"}`}>MVP {mvpCount}회</div>
              <div className="text-[10px] text-gray-600">시즌 경기</div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${fairplayCount > 0 ? "bg-blue-400/10 border-blue-400/25" : "bg-white/[0.02] border-white/8"}`}>
            <span className="text-xl">🤝</span>
            <div>
              <div className={`font-black text-sm ${fairplayCount > 0 ? "text-blue-300" : "text-gray-600"}`}>페어플레이 {fairplayCount}회</div>
              <div className="text-[10px] text-gray-600">시즌 경기</div>
            </div>
          </div>
        </div>

        {/* 스카우터 전용 연락처 */}
        {isScout && (
          <div className="mt-5 bg-green-400/5 border border-green-400/15 rounded-xl p-4">
            <p className="text-[10px] text-green-400/80 font-bold uppercase tracking-widest mb-3">보호자 연락처</p>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs mb-0.5">성함</p>
                <p className="font-medium">{player.parentName}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">연락처</p>
                <p className="font-medium">{player.parentPhone}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs mb-0.5">이메일</p>
                <p className="font-medium">{player.parentEmail}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입단 제의 (스카우터 전용) */}
      {isScout && (
        <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-black mb-4">입단 제의 보내기</h2>
          {offerSent ? (
            <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 text-center text-green-400 font-bold text-sm">
              입단 제의가 전달되었습니다!
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">구단명 / 학교명</label>
                <input
                  value={offerForm.clubName}
                  onChange={(e) => setOfferForm({ ...offerForm, clubName: e.target.value })}
                  placeholder="○○FC / ○○중학교"
                  className="w-full bg-black border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-400/60"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">제의 메시지</label>
                <textarea
                  rows={4}
                  value={offerForm.message}
                  onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                  placeholder="선수에게 전달할 메시지를 작성해주세요."
                  className="w-full bg-black border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-400/60 resize-none"
                />
              </div>
              {offerError && <p className="text-red-400 text-sm">{offerError}</p>}
              <button
                onClick={sendOffer}
                className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors text-sm"
              >
                입단 제의 보내기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 받은 제의 (본인만) */}
      {player.offersReceived && player.offersReceived.length > 0 && (
        <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-black mb-4">받은 입단 제의</h2>
          <div className="space-y-3">
            {player.offersReceived.map((offer) => (
              <div key={offer.id} className="border border-white/8 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm">{offer.clubName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    offer.status === "ACCEPTED"
                      ? "border-green-400/25 text-green-400 bg-green-400/5"
                      : offer.status === "REJECTED"
                      ? "border-red-400/25 text-red-400"
                      : "border-yellow-400/25 text-yellow-400"
                  }`}>
                    {offer.status === "ACCEPTED" ? "수락" : offer.status === "REJECTED" ? "거절" : "대기 중"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{offer.scout.name} · {offer.scout.organization}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경기 기록 - 시즌제 등록 기반 */}
      <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black">경기 기록</h2>
          <span className="text-xs text-gray-700">{seasonRegs.length}경기</span>
        </div>

        {seasonRegs.length === 0 ? (
          <div className="text-center py-10 text-gray-700 text-sm">아직 시즌 경기 기록이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {seasonRegs.map((reg) => (
              <div key={reg.id} className="border border-white/6 rounded-xl p-4 hover:border-white/12 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        reg.status === "CONFIRMED"
                          ? "border-green-400/20 text-green-400 bg-green-400/5"
                          : "border-yellow-400/20 text-yellow-400"
                      }`}>
                        {reg.status === "CONFIRMED" ? "확정" : "대기"}
                      </span>
                      {reg.isGK && (
                        <span className="text-[10px] text-green-400/70 border border-green-400/15 px-1.5 py-0.5 rounded-full">
                          🧤 GK
                        </span>
                      )}
                      {reg.team && (
                        <span className="text-[10px] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: reg.team.color }} />
                          {reg.team.name}
                        </span>
                      )}
                    </div>
                    <Link href={`/matches/${reg.schedule.id}`}
                      className="font-bold text-sm hover:text-green-400 transition-colors">
                      {reg.schedule.title}
                    </Link>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(reg.schedule.scheduledAt).toLocaleDateString("ko-KR", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                      {reg.schedule.location && ` · ${reg.schedule.location}`}
                      {reg.schedule.gameFormat && ` · ${reg.schedule.gameFormat.replace("v", " vs ")}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {reg.schedule.videoUrl && (
                      <a
                        href={reg.schedule.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 border border-green-400/20 px-2.5 py-1.5 rounded-lg hover:bg-green-400/5 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        영상 보기
                      </a>
                    )}
                    <Link href={`/matches/${reg.schedule.id}`}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                      상세 →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
