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
  teamLabel?: string | null;
  jerseyNumber?: string | null;
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
    status: string;
  };
}

interface Player {
  id: string;
  name: string;
  birthYear: number;
  height: number | null;
  school: string;
  position: string | null;
  preferredFoot: string | null;
  yearsExp: number | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  isOwn: boolean;
  votesGiven?: Array<{ scheduleId: string; voteType: string }>;
  seasonMvp?: number;
  seasonFairplay?: number;
  openMvp?: number;
  openFairplay?: number;
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
  const [editingPosition, setEditingPosition] = useState(false);
  const [positionValue, setPositionValue] = useState("");
  const [editingFoot, setEditingFoot] = useState(false);
  const [footValue, setFootValue] = useState("");
  const [matchTab, setMatchTab] = useState<"season" | "match" | null>(null);

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

  const savePosition = async () => {
    if (!positionValue) return;
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: positionValue }),
    });
    if (res.ok) {
      setPlayer((p) => p ? { ...p, position: positionValue } : p);
      setEditingPosition(false);
    }
  };

  const saveFoot = async () => {
    if (!footValue) return;
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredFoot: footValue }),
    });
    if (res.ok) {
      setPlayer((p) => p ? { ...p, preferredFoot: footValue } : p);
      setEditingFoot(false);
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
  const openMatchRegs = player.scheduleRegistrations.filter((r) => r.schedule.type === "ONEDAY" && r.status === "CONFIRMED");
  const totalGoals = confirmedRegs.reduce((acc, r) => acc + (r.goals || 0), 0);
  const totalAssists = confirmedRegs.reduce((acc, r) => acc + (r.assists || 0), 0);
  const openRegs = player.scheduleRegistrations.filter((r) => r.schedule.type === "ONEDAY" && r.status !== "CANCELLED");
  const mvpCount = player.seasonMvp ?? confirmedRegs.filter((r) => r.isMVP).length;
  const fairplayCount = player.seasonFairplay ?? confirmedRegs.filter((r) => r.isFairplay).length;
  const openMvpCount = player.openMvp ?? openRegs.filter((r) => r.isMVP).length;
  const openFairplayCount = player.openFairplay ?? openRegs.filter((r) => r.isFairplay).length;
  const isScout = user?.role === "SCOUT" || user?.role === "DIRECTOR" || user?.role === "ADMIN";
  const isOwner = player.isOwn;
  const votesGiven: Array<{ scheduleId: string; voteType: string }> = player.votesGiven || [];
  const hasVotedAll = (scheduleId: string) => {
    const v = votesGiven.filter((v) => v.scheduleId === scheduleId);
    return v.some((v) => v.voteType === "MVP") && v.some((v) => v.voteType === "FAIRPLAY");
  };
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
                <span className="bg-green-400/10 text-green-400 border border-green-400/20 text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
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
            {/* 포지션 수정 */}
            {isOwner && !editingPosition && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">
                  포지션: <span className="text-gray-400 font-bold">{player.position || "미설정"}</span>
                </span>
                <button onClick={() => { setPositionValue(player.position || ""); setEditingPosition(true); }}
                  className="text-[10px] text-green-400/70 hover:text-green-400 border border-green-400/20 px-2 py-0.5 rounded">✎ 변경</button>
              </div>
            )}
            {editingPosition && (
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={positionValue}
                  onChange={(e) => setPositionValue(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-400"
                >
                  <option value="">포지션 선택</option>
                  <option value="골키퍼">골키퍼</option>
                  <option value="수비수">수비수</option>
                  <option value="미드필더">미드필더</option>
                  <option value="공격수">공격수</option>
                </select>
                <button onClick={savePosition} className="text-xs bg-green-400 text-black font-bold px-3 py-1.5 rounded-lg">저장</button>
                <button onClick={() => setEditingPosition(false)} className="text-xs text-gray-600 hover:text-white">취소</button>
              </div>
            )}
            {/* 주사용발 */}
            {!editingFoot && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">
                  주사용발: <span className="text-gray-400 font-bold">{player.preferredFoot || "미설정"}</span>
                </span>
                {isOwner && (
                  <button onClick={() => { setFootValue(player.preferredFoot || ""); setEditingFoot(true); }}
                    className="text-[10px] text-green-400/70 hover:text-green-400 border border-green-400/20 px-2 py-0.5 rounded">✎ 변경</button>
                )}
              </div>
            )}
            {editingFoot && (
              <div className="flex items-center gap-2 mt-2">
                {["오른발", "왼발", "양발"].map((f) => (
                  <button key={f} type="button"
                    onClick={() => setFootValue(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                      footValue === f ? "bg-green-400 text-black border-green-400" : "border-white/10 text-gray-500 hover:border-white/30"
                    }`}>{f}</button>
                ))}
                <button onClick={saveFoot} className="text-xs bg-green-400 text-black font-bold px-3 py-1.5 rounded-lg">저장</button>
                <button onClick={() => setEditingFoot(false)} className="text-xs text-gray-600 hover:text-white">취소</button>
              </div>
            )}
            {/* 축구 경력 */}
            {player.yearsExp && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">
                  축구 경력: <span className="text-gray-400 font-bold">{player.yearsExp}년차</span>
                </span>
              </div>
            )}
          </div>
          <Link href="/players"
            className="text-xs text-gray-600 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors">
            ← 목록
          </Link>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
          <button onClick={() => setMatchTab((t) => t === "season" ? null : "season")}
            className={`bg-black/40 border rounded-xl p-4 text-center hover:bg-black/60 transition-colors ${matchTab === "season" ? "border-green-400/30" : "border-white/5"}`}>
            <div className="text-2xl font-black text-green-400">{confirmedRegs.length}</div>
            <div className="text-xs text-gray-600 mt-1">시즌 경기</div>
          </button>
          <button onClick={() => setMatchTab((t) => t === "match" ? null : "match")}
            className={`bg-black/40 border rounded-xl p-4 text-center hover:bg-black/60 transition-colors ${matchTab === "match" ? "border-orange-400/30" : "border-white/5"}`}>
            <div className="text-2xl font-black text-orange-400">{openMatchRegs.length}</div>
            <div className="text-xs text-gray-600 mt-1">매칭 경기</div>
          </button>
          {[
            { label: "골", value: totalGoals },
            { label: "어시스트", value: totalAssists },
            { label: "포지션", value: player.position || "-" },
            { label: "팀", value: seasonRegs[0]?.team?.name || "-" },
          ].map((s) => (
            <div key={s.label} className="bg-black/40 border border-white/5 rounded-xl p-4 text-center">
              <div className={`font-black text-green-400 ${s.label === "포지션" ? "text-sm leading-tight" : "text-2xl"}`}>{s.value}</div>
              <div className="text-xs text-gray-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 시즌 경기 목록 */}
        {matchTab === "season" && (
          <div className="mt-4 bg-black/20 border border-white/6 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 mb-3">시즌 경기 목록</p>
            {confirmedRegs.length === 0 ? (
              <p className="text-sm text-gray-600">시즌 경기 기록이 없습니다.</p>
            ) : confirmedRegs.map((r) => {
              const d = new Date(r.schedule.scheduledAt);
              return (
                <Link key={r.id} href={`/matches/${r.schedule.id}`}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/6 rounded-xl hover:border-green-400/25 transition-colors">
                  <div className="text-sm font-black text-green-400 w-10 text-center">
                    {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "")}일
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-0.5">
                      {r.isMVP && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-yellow-300 border-yellow-400/40 bg-yellow-400/10">⭐ MVP</span>
                      )}
                      {r.isFairplay && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-blue-300 border-blue-400/40 bg-blue-400/10">🤝 페어플레이</span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate">{r.schedule.title}</p>
                    <p className="text-xs text-gray-600">{d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 매칭 경기 목록 */}
        {matchTab === "match" && (
          <div className="mt-4 bg-black/20 border border-white/6 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 mb-3">매칭 경기 목록</p>
            {openMatchRegs.length === 0 ? (
              <p className="text-sm text-gray-600">매칭 경기 기록이 없습니다.</p>
            ) : openMatchRegs.map((r) => {
              const d = new Date(r.schedule.scheduledAt);
              return (
                <Link key={r.id} href={`/matches/${r.schedule.id}`}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/6 rounded-xl hover:border-orange-400/25 transition-colors">
                  <div className="text-sm font-black text-orange-400 w-10 text-center shrink-0">
                    {new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "")}일
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-blue-400 border-blue-400/25 bg-blue-400/8">오픈 매칭</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${r.schedule.status === "ENDED" ? "text-purple-400 border-purple-400/20 bg-purple-400/8" : "text-green-400 border-green-400/20 bg-green-400/8"}`}>
                        {r.schedule.status === "ENDED" ? "경기끝" : "확정"}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${r.teamLabel ? "text-orange-300 border-orange-400/30" : "text-gray-600 border-white/10"}`}>
                        {r.teamLabel || "미배정"}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${r.jerseyNumber ? "text-blue-300 border-blue-400/30" : "text-gray-600 border-white/10"}`}>
                        {r.jerseyNumber ? `등번호 : ${r.jerseyNumber}` : "번호미배정"}
                      </span>
                      {r.isMVP && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-yellow-300 border-yellow-400/40 bg-yellow-400/10">⭐ MVP</span>
                      )}
                      {r.isFairplay && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border text-blue-300 border-blue-400/40 bg-blue-400/10">🤝 페어플레이</span>
                      )}
                    </div>
                    <p className="text-sm font-bold truncate">{r.schedule.title}</p>
                    <p className="text-xs text-gray-600">{d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}</p>
                  </div>
                  {isOwner && r.schedule.status === "ENDED" && (
                    hasVotedAll(r.schedule.id) ? (
                      <span className="text-[10px] font-bold text-gray-600 border border-white/8 px-2.5 py-1.5 rounded-full whitespace-nowrap shrink-0">투표완료</span>
                    ) : (
                      <Link href={`/dashboard/vote/${r.schedule.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-bold text-purple-400 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1.5 rounded-full hover:bg-purple-400/10 transition-colors whitespace-nowrap shrink-0">
                        투표하기
                      </Link>
                    )
                  )}
                </Link>
              );
            })}
          </div>
        )}

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
        </div>

        {/* MVP / 페어플레이 뱃지 - 2줄 그리드 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* 시즌 경기 행 */}
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
          {/* 오픈 매칭 행 */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${openMvpCount > 0 ? "bg-orange-400/10 border-orange-400/25" : "bg-white/[0.02] border-white/8"}`}>
            <span className="text-xl">⭐</span>
            <div>
              <div className={`font-black text-sm ${openMvpCount > 0 ? "text-orange-300" : "text-gray-600"}`}>MVP {openMvpCount}회</div>
              <div className="text-[10px] text-gray-600">오픈 매칭</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${openFairplayCount > 0 ? "bg-purple-400/10 border-purple-400/25" : "bg-white/[0.02] border-white/8"}`}>
            <span className="text-xl">🤝</span>
            <div>
              <div className={`font-black text-sm ${openFairplayCount > 0 ? "text-purple-300" : "text-gray-600"}`}>페어플레이 {openFairplayCount}회</div>
              <div className="text-[10px] text-gray-600">오픈 매칭</div>
            </div>
          </div>
        </div>

        {/* 스카우터 전용 연락처 (관리자만, 스카우터/감독 제외) */}
        {user?.role === "ADMIN" && (
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

      {/* 받은 입단 제의 */}
      {player.offersReceived && player.offersReceived.length > 0 && (
        <div className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-6 mb-6">
          {isOwner ? (
            /* 본인: 상세 내용 모두 표시 */
            <>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-black">받은 입단 제의</h2>
                <span className="text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-0.5 rounded-full">
                  {player.offersReceived.length}건
                </span>
              </div>
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
                    <p className="text-xs text-gray-600 mb-2">{offer.message}</p>
                    {offer.status === "PENDING" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async () => {
                            await fetch(`/api/offers/${offer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ACCEPTED" }) });
                            setPlayer({ ...player, offersReceived: player.offersReceived!.map((o) => o.id === offer.id ? { ...o, status: "ACCEPTED" } : o) });
                          }}
                          className="text-xs bg-green-400/10 border border-green-400/25 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-400/20 transition-colors font-bold"
                        >수락</button>
                        <button
                          onClick={async () => {
                            await fetch(`/api/offers/${offer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECTED" }) });
                            setPlayer({ ...player, offersReceived: player.offersReceived!.map((o) => o.id === offer.id ? { ...o, status: "REJECTED" } : o) });
                          }}
                          className="text-xs border border-white/10 text-gray-500 px-3 py-1.5 rounded-lg hover:border-red-400/25 hover:text-red-400 transition-colors"
                        >거절</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* 타인: 건수만 표시 */
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black">받은 입단 제의</h2>
              <span className="text-sm font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-0.5 rounded-full">
                {player.offersReceived.length}건
              </span>
            </div>
          )}
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
