"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { getVideoEmbed } from "@/lib/video";

const GRADE_LABEL: Record<string, string> = {
  ALL: "", G12: "초등 1~2학년", G34: "초등 3~4학년", G45: "초등 4~5학년",
  G56: "초등 5~6학년", M1: "중학교 1학년",
};

function getGradeBirthRange(gradeLevel: string): string {
  const y = new Date().getFullYear();
  const ranges: Record<string, [number, number]> = {
    G12: [y - 8, y - 7], G34: [y - 10, y - 9], G45: [y - 11, y - 10],
    G56: [y - 12, y - 11], M1: [y - 13, y - 13],
  };
  const r = ranges[gradeLevel];
  return r ? `${r[0]}~${r[1]}년생` : "";
}

const LEVEL_LABEL: Record<string, string> = {
  ALL: "레벨 무관",
  U1: "1년차까지", U2: "2년차까지", U3: "3년차까지", U4: "4년차까지", U5: "5년차까지",
  U6: "6년차까지", U7: "7년차까지", U8: "8년차까지", U9: "9년차까지", U10: "10년차까지",
  U6P: "6년 이상",
};

interface Schedule {
  id: string;
  title: string;
  type: string;
  level: string;
  gradeLevel: string;
  gameFormat: string;
  description: string | null;
  scheduledAt: string;
  location: string | null;
  maxPlayers: number;
  maxGK: number;
  fee: number;
  recruitmentStart: string | null;
  recruitmentEnd: string | null;
  status: string;
  videoUrl: string | null;
  videoTitle: string | null;
  season: { name: string } | null;
  _count: { registrations: number };
  scheduleTeams: { id: string; name: string; color: string; maxPlayers: number; _count: { registrations: number } }[];
  positionStatus: Record<string, { max: number; current: number; full: boolean }>;
}

interface Player {
  id: string;
  name: string;
  school: string;
  position: string | null;
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  const router = useRouter();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/schedules/${id}`)
      .then((r) => r.json())
      .then((data) => { setSchedule(data); setLoading(false); });

    if (session) {
      fetch("/api/players")
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setMyPlayers(list);
          if (list.length > 0) setSelectedPlayer(list[0].id);
        });
    }
  }, [id, session]);

  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [insuranceAgreed, setInsuranceAgreed] = useState(false);

  const handleRegister = async () => {
    if (!selectedPlayer) return;
    // 오픈 매칭이면 보험 동의 팝업 먼저
    if (schedule?.type === "ONEDAY" && !insuranceAgreed) {
      setShowInsuranceModal(true);
      return;
    }
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/schedules/${id}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: selectedPlayer, teamId: selectedTeam || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!schedule || "error" in schedule) return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">경기를 찾을 수 없습니다.</div>
  );

  const now = new Date();
  const schedDate = new Date(schedule.scheduledAt);
  const dateStr = schedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Seoul" });
  const timeStr = schedDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" });
  const recStart = schedule.recruitmentStart ? new Date(schedule.recruitmentStart) : null;
  const recEnd = schedule.recruitmentEnd ? new Date(schedule.recruitmentEnd) : null;
  const isFull = schedule._count.registrations >= schedule.maxPlayers;
  const notStarted = recStart && now < recStart;
  const ended = recEnd && now > recEnd;
  const canRegister = schedule.status === "RECRUITING" && !isFull && !notStarted && !ended;
  const embed = schedule.videoUrl ? getVideoEmbed(schedule.videoUrl) : null;

  return (
    <div className="min-h-screen">

      {/* ── 보험 동의 팝업 ── */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-black text-lg mb-1">부상 및 보험 안내</h3>
            <p className="text-xs text-orange-400 font-bold mb-4">경기 참여 전 반드시 확인해주세요</p>
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-xs text-gray-400 leading-relaxed space-y-2 mb-5">
              <p>• 본 경기는 <strong className="text-white">개인 스포츠 활동</strong>으로 진행됩니다.</p>
              <p>• 경기 중 발생하는 부상은 <strong className="text-white">개인 보험(실손보험 등)</strong>으로 처리해야 합니다.</p>
              <p>• Ronda Libre는 경기 중 발생한 부상에 대해 별도의 단체 보험을 제공하지 않습니다.</p>
              <p>• 참가 전 개인 상해보험 가입 여부를 확인하시고, 건강 상태가 좋지 않을 경우 참여를 자제해 주세요.</p>
              <p>• 경기 참가 신청 시 위 내용에 동의한 것으로 간주됩니다.</p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={insuranceAgreed}
                onChange={(e) => setInsuranceAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-orange-400 shrink-0"
              />
              <span className="text-sm text-gray-300 leading-snug">위 내용을 모두 확인하였으며, 부상 발생 시 개인 보험으로 처리됨에 동의합니다.</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowInsuranceModal(false); setInsuranceAgreed(false); }}
                className="flex-1 border border-white/10 text-gray-400 py-2.5 rounded-xl text-sm font-bold hover:border-white/20 transition-colors"
              >
                취소
              </button>
              <button
                disabled={!insuranceAgreed}
                onClick={() => { setShowInsuranceModal(false); handleRegister(); }}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-black hover:bg-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                동의 후 신청
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
              schedule.type === "SEASON"
                ? "border-green-400/25 text-green-400 bg-green-400/5"
                : "border-orange-500/30 text-orange-400 bg-orange-500/10"
            }`}>
              {schedule.type === "SEASON" ? "시즌 리그" : "오픈 매칭"}
            </span>
            {schedule.level && schedule.level !== "ALL" && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-400/25 text-blue-400 bg-blue-400/5 whitespace-nowrap">
                {LEVEL_LABEL[schedule.level] || schedule.level}
              </span>
            )}
            {schedule.gameFormat && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-400/20 text-blue-400/80 bg-blue-400/5 whitespace-nowrap">
                {schedule.gameFormat.replace("v", " vs ")} 축구
              </span>
            )}
            {schedule.season && (
              <span className="text-xs text-gray-700">{schedule.season.name}</span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{schedule.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>
              {dateStr} {timeStr}
            </span>
            {schedule.location && <span>📍 {schedule.location}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-6">
        {/* Main */}
        <div className="sm:col-span-2 space-y-6">
          {schedule.description && (
            <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">경기 소개</p>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{schedule.description}</p>
            </div>
          )}

          {/* 모집 기간 (시즌형) */}
          {schedule.type === "SEASON" && (recStart || recEnd) && (
            <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">모집 기간</p>
              <p className="text-sm text-gray-300">
                {recStart ? recStart.toLocaleDateString("ko-KR") : "??"} ~{" "}
                {recEnd ? recEnd.toLocaleDateString("ko-KR") : "??"}
              </p>
              {notStarted && (
                <div className="mt-3 text-xs text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/15 rounded-lg px-3 py-2">
                  {recStart!.toLocaleDateString("ko-KR")}부터 신청 가능합니다.
                </div>
              )}
            </div>
          )}

          {/* 영상 */}
          {schedule.videoUrl && (
            <div>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">경기 영상</p>
              {schedule.videoTitle && <p className="text-sm text-gray-500 mb-3">{schedule.videoTitle}</p>}
              {embed?.type === "youtube" ? (
                <div className="aspect-video rounded-2xl overflow-hidden">
                  <iframe
                    src={embed.src}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a href={schedule.videoUrl!} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/8 rounded-xl hover:border-green-400/30 hover:bg-green-400/5 transition-all group">
                  <div className="w-10 h-10 bg-green-400/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-400/20 transition-colors">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">영상 보기 →</p>
                    <p className="text-xs text-gray-600">새 탭에서 열립니다</p>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: 신청 카드 */}
        <div>
          <div className={`border rounded-2xl p-6 sticky top-20 space-y-4 ${
            schedule.type === "ONEDAY"
              ? "bg-[#1a0f00] border-orange-500/25"
              : "bg-white/[0.02] border-white/8"
          }`}>
            {/* 학년 안내 */}
            {schedule.gradeLevel && schedule.gradeLevel !== "ALL" && (
              <div className="flex items-center gap-2 p-3 bg-purple-400/5 border border-purple-400/15 rounded-xl">
                <span className="text-purple-400 text-sm">🎓</span>
                <div>
                  <span className="text-xs text-purple-300 font-bold">
                    {GRADE_LABEL[schedule.gradeLevel]} 대상
                  </span>
                  <span className="text-xs text-gray-600 ml-2">
                    {getGradeBirthRange(schedule.gradeLevel)}
                  </span>
                </div>
              </div>
            )}

            {/* 레벨 안내 */}
            {schedule.level && schedule.level !== "ALL" && (
              <div className="flex items-start gap-2 p-3 bg-blue-400/5 border border-blue-400/15 rounded-xl">
                <span className="text-blue-400 text-sm mt-0.5">⚡</span>
                <div>
                  <p className="text-xs text-blue-300 font-bold leading-snug">
                    {LEVEL_LABEL[schedule.level] || schedule.level}<br />신청 가능
                  </p>
                  <p className="text-[10px] text-gray-600">(골키퍼 제외)</p>
                </div>
              </div>
            )}

            {/* 가격 */}
            <div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-black">
                  {schedule.fee === 0 ? "무료" : `${schedule.fee.toLocaleString()}원`}
                </div>
                {schedule.fee === 0 && schedule.type === "ONEDAY" && (
                  <span className="text-[10px] font-bold bg-green-400/15 text-green-400 border border-green-400/25 px-2 py-0.5 rounded-full mb-1">
                    베타 무료
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                <span>{schedule._count.registrations}/{schedule.maxPlayers}명</span>
                <span className={`font-bold ${
                  schedule.status === "COMPLETED" ? "text-gray-600"
                  : isFull ? "text-red-400"
                  : canRegister ? "text-green-400"
                  : "text-yellow-400"
                }`}>
                  {schedule.status === "COMPLETED" ? "완료" : isFull ? "마감" : canRegister ? "모집 중" : notStarted ? "오픈 예정" : "마감"}
                </span>
              </div>
            </div>

            {/* progress bar */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (schedule._count.registrations / schedule.maxPlayers) * 100)}%` }}
              />
            </div>

            {/* 베타 알림 */}
            {schedule.type === "ONEDAY" && schedule.fee === 0 && (
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3">
                <p className="text-[11px] font-bold text-yellow-400 mb-1.5">⚠️ 오픈 베타 안내</p>
                <ul className="text-[10px] text-gray-500 leading-relaxed space-y-0.5 list-none">
                  <li>· 신청 마감은 경기 하루 전입니다.</li>
                  <li>· 16명 이하 신청 매칭은 취소됩니다.</li>
                  <li>· 현재 문자 발송이 지원되지 않습니다.</li>
                  <li>· 매치 하루 전 웹사이트에서 확정 여부를 꼭 확인하세요.</li>
                </ul>
              </div>
            )}

            {/* GK 무료 안내 */}
            <div className="bg-green-400/5 border border-green-400/15 rounded-xl p-3">
              <p className="text-xs font-bold text-green-400 mb-1">🧤 GK 무료 참가</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                골키퍼(GK) 포지션은 무료로 참가 가능합니다.<br />
                팀당 1명 제한 (최대 {schedule.maxGK}명)<br />
                <span className="text-gray-500">골키퍼(GK)는 축구를 시작한 기간과 관계없이 신청할 수 있습니다.</span>
              </p>
            </div>

            {/* 포지션 현황 */}
            {schedule.positionStatus && (
              <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 mb-3">포지션별 잔여 자리</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { pos: "GK", label: "골키퍼", icon: "🧤" },
                    { pos: "DF", label: "수비수", icon: "🛡️" },
                    { pos: "MF", label: "미드필더", icon: "⚙️" },
                    { pos: "FW", label: "공격수", icon: "⚡" },
                  ].map(({ pos, label, icon }) => {
                    const s = schedule.positionStatus[pos];
                    const remaining = s ? s.max - s.current : 0;
                    const isFull = s?.full;
                    return (
                      <div
                        key={pos}
                        className={`rounded-xl p-3 flex flex-col items-center justify-center border ${
                          isFull
                            ? "border-red-400/20 bg-red-400/5"
                            : "border-green-400/15 bg-green-400/5"
                        }`}
                      >
                        <div className="text-base mb-1">{icon}</div>
                        <div className="text-[11px] font-black text-white leading-none">{pos}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5 text-center leading-tight">{label}</div>
                        {isFull ? (
                          <div className="text-[11px] font-black text-red-400 mt-1.5">마감</div>
                        ) : (
                          <div className="text-[11px] font-black text-green-400 mt-1.5">
                            {remaining}<span className="text-[9px] text-gray-500 font-normal">자리</span>
                          </div>
                        )}
                        {s && (
                          <div className="text-[9px] text-gray-700 mt-0.5">{s.current}/{s.max}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {success ? (
              <div className="space-y-3">
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 text-center">
                  <p className="text-green-400 font-bold text-sm mb-1">✓ 신청 완료!</p>
                  {myPlayers.find((p) => p.id === selectedPlayer)?.position === "GK" ? (
                    <p className="text-green-400/70 text-xs">GK 무료 — 즉시 확정되었습니다.</p>
                  ) : (
                    <p className="text-gray-500 text-xs">아래 계좌로 입금 후 신청이 확정됩니다.</p>
                  )}
                </div>
                {myPlayers.find((p) => p.id === selectedPlayer)?.position !== "GK" && (
                  <div className="bg-[#0d0d0d] border border-white/8 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">입금 안내</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">은행</span>
                      <span className="text-sm font-bold text-white">카카오뱅크</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">계좌번호</span>
                      <span className="text-sm font-bold text-white">3333-01-0000000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">예금주</span>
                      <span className="text-sm font-bold text-white">Ronda Libre</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">금액</span>
                      <span className="text-sm font-black text-green-400">{schedule.fee.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">입금자명</span>
                      <span className="text-sm font-bold text-white">
                        {myPlayers.find((p) => p.id === selectedPlayer)?.name}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-700 text-center">
                        입금 확인 후 관리자가 신청을 확정합니다. 미입금 시 자동 취소될 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : canRegister && session ? (
              <div className="space-y-3">
                {myPlayers.length > 0 ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-600 mb-1.5 block">신청 선수</label>
                      <select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-400"
                      >
                        {myPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.position ? `(${p.position})` : ""} — {p.school}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* 팀 선택 (시즌 리그 + 팀이 있을 때) */}
                    {schedule.type === "SEASON" && schedule.scheduleTeams.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-600 mb-1.5 block">참가 팀 선택</label>
                        <div className="space-y-2">
                          {schedule.scheduleTeams.map((t) => {
                            const isFull = t._count.registrations >= t.maxPlayers;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                disabled={isFull}
                                onClick={() => setSelectedTeam(selectedTeam === t.id ? "" : t.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                                  selectedTeam === t.id
                                    ? "border-green-400/50 bg-green-400/5 text-white"
                                    : isFull
                                    ? "border-white/5 text-gray-700 cursor-not-allowed"
                                    : "border-white/8 text-gray-400 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                                  <span className="font-bold">{t.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">{t._count.registrations}/{t.maxPlayers}명</span>
                                  {isFull && <span className="text-[10px] text-red-400">마감</span>}
                                  {selectedTeam === t.id && <span className="text-[10px] text-green-400">✓ 선택</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {schedule.type === "SEASON" && !selectedTeam && (
                          <p className="text-[10px] text-yellow-400/70 mt-1.5">팀을 선택해주세요</p>
                        )}
                      </div>
                    )}
                    {/* 선택된 선수가 GK면 무료 배지 */}
                    {myPlayers.find((p) => p.id === selectedPlayer)?.position === "GK" && (
                      <div className="text-xs text-green-400 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2 font-bold">
                        GK 포지션 — 무료 참가 적용
                      </div>
                    )}
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button
                      onClick={handleRegister}
                      disabled={submitting}
                      className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50 text-sm"
                    >
                      {submitting ? "신청 중..." : myPlayers.find((p) => p.id === selectedPlayer)?.position === "GK" ? "무료 신청하기" : `${schedule.fee.toLocaleString()}원 신청하기`}
                    </button>
                    <p className="text-[10px] text-gray-700 text-center">GK 외 선수는 신청 후 계좌이체 결제</p>
                  </>
                ) : (
                  <a href="/dashboard/register"
                    className="block w-full bg-white/5 text-gray-400 text-center py-3 rounded-xl text-sm hover:bg-white/10">
                    먼저 프로필을 등록하세요
                  </a>
                )}
              </div>
            ) : !session ? (
              <a href="/login"
                className="block w-full bg-green-400 text-black font-black py-3 rounded-xl text-center text-sm hover:bg-green-300 transition-colors">
                로그인 후 신청
              </a>
            ) : (
              <div className="text-center text-xs text-gray-700 py-3">
                {schedule.status === "COMPLETED" ? "종료된 경기입니다." : "신청이 마감되었습니다."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
