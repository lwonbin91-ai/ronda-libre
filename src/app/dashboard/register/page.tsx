"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Schedule {
  id: string;
  title: string;
  type: string;
  fee: number;
  scheduledAt: string;
  recruitmentStart: string | null;
  recruitmentEnd: string | null;
  level: string;
  gradeLevel: string;
  gameFormat: string;
  location: string | null;
  scheduleTeams: Array<{ id: string; name: string; color: string; maxPlayers: number; _count: { registrations: number } }>;
  _count: { registrations: number };
  maxPlayers: number;
}

const GRADE_LABELS: Record<string, string> = {
  ALL: "전체 학년", G12: "초등 1~2학년", G34: "초등 3~4학년", G56: "초등 5~6학년", M1: "중학교 1학년",
};

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<"player" | "season">("player");
  const [seasons, setSeasons] = useState<Schedule[]>([]);
  const [selectedType, setSelectedType] = useState<"SEASON" | "ONEDAY">("SEASON");
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [playerForm, setPlayerForm] = useState({
    name: "",
    birthYear: new Date().getFullYear() - 10,
    height: "",
    school: "",
    position: "",
    yearsExp: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const [seasonForm, setSeasonForm] = useState({
    seasonId: "",
    teamId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/players")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            router.replace("/dashboard");
          }
        });
    }
    fetch("/api/schedules?status=RECRUITING")
      .then((r) => r.json())
      .then((data) => setSeasons(Array.isArray(data) ? data : []));
  }, [status, router]);

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(playerForm),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "오류 발생");
    } else {
      setPlayerId(data.id);
      setStep("season");
    }
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/schedules/${seasonForm.seasonId}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        teamId: selectedType === "SEASON" ? seasonForm.teamId : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "오류 발생");
    } else {
      router.push("/dashboard");
    }
  };

  const filteredSeasons = seasons.filter((s) => s.type === (selectedType === "SEASON" ? "SEASON" : "ONEDAY"));

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${step === "player" ? "bg-green-400 text-black" : "bg-green-400/20 text-green-400"}`}>1</div>
          <div className="h-px flex-1 bg-white/10" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${step === "season" ? "bg-green-400 text-black" : "bg-white/10 text-gray-600"}`}>2</div>
        </div>
        <h1 className="text-3xl font-black">
          {step === "player" ? "내 정보 입력" : "리그 신청"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {step === "player" ? "선수 정보와 보호자 연락처를 정확히 입력해주세요." : "참여할 리그 유형과 시즌을 선택하세요."}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {step === "player" && (
        <form onSubmit={handlePlayerSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4">
          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-2">선수 정보</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">이름 *</label>
              <input
                required
                value={playerForm.name}
                onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">출생연도 *</label>
              <input
                required
                type="number"
                min={2005}
                max={2020}
                value={playerForm.birthYear}
                onChange={(e) => setPlayerForm({ ...playerForm, birthYear: parseInt(e.target.value) })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">학교/클럽명 *</label>
              <input
                required
                value={playerForm.school}
                onChange={(e) => setPlayerForm({ ...playerForm, school: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                placeholder="○○초등학교"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">키 (cm)</label>
              <input
                type="number"
                min={100}
                max={220}
                value={playerForm.height}
                onChange={(e) => setPlayerForm({ ...playerForm, height: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                placeholder="150"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">선호 포지션</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlayerForm({ ...playerForm, position: playerForm.position === p ? "" : p })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                    playerForm.position === p
                      ? "bg-green-400 text-black border-green-400"
                      : "border-white/10 text-gray-500 hover:border-white/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              축구를 시작한 지 얼마나 되셨나요? <span className="text-green-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setPlayerForm({ ...playerForm, yearsExp: String(y) })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-colors ${
                    playerForm.yearsExp === String(y)
                      ? "bg-green-400 text-black border-green-400"
                      : "border-white/10 text-gray-500 hover:border-white/30"
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mb-4">보호자 정보</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">보호자 성함 *</label>
                <input
                  required
                  value={playerForm.parentName}
                  onChange={(e) => setPlayerForm({ ...playerForm, parentName: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="홍부모"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">연락처 *</label>
                <input
                  required
                  type="tel"
                  value={playerForm.parentPhone}
                  onChange={(e) => setPlayerForm({ ...playerForm, parentPhone: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">이메일 *</label>
                <input
                  required
                  type="email"
                  value={playerForm.parentEmail}
                  onChange={(e) => setPlayerForm({ ...playerForm, parentEmail: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
                  placeholder="parent@email.com"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "저장 중..." : "다음 단계 →"}
          </button>
        </form>
      )}

      {step === "season" && (
        <form onSubmit={handleSeasonSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">참여 유형 선택</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: "SEASON", label: "시즌 리그", price: "89,000원/월" },
                { val: "ONEDAY", label: "오픈 매칭", price: "25,000원/1회" },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setSelectedType(t.val as "SEASON" | "ONEDAY")}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    selectedType === t.val
                      ? "border-green-400 bg-green-400/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="font-bold text-sm">{t.label}</div>
                  <div className="text-green-400 text-xs font-bold mt-1">{t.price}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">시즌 선택</label>
            {filteredSeasons.length === 0 ? (
              <div className="text-gray-600 text-sm bg-black rounded-xl p-4">현재 모집 중인 시즌이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {filteredSeasons.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeasonForm({ ...seasonForm, seasonId: s.id, teamId: "" })}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      seasonForm.seasonId === s.id
                        ? "border-green-400 bg-green-400/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-bold">{s.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(s.scheduledAt).toLocaleDateString("ko-KR")} · {s.location || "장소 미정"}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {s.gameFormat} · {s.level !== "ALL" ? s.level : "전체 레벨"}
                      {s.gradeLevel && s.gradeLevel !== "ALL" && ` · ${GRADE_LABELS[s.gradeLevel] || s.gradeLevel}`}
                    </div>
                    <div className="text-green-400 text-sm font-bold mt-1">{s.fee.toLocaleString()}원</div>
                    <div className="text-xs text-gray-600 mt-1">
                      신청 {s._count.registrations} / {s.maxPlayers}명
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedType === "SEASON" && seasonForm.seasonId && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">팀 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {seasons.find((s) => s.id === seasonForm.seasonId)?.scheduleTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSeasonForm({ ...seasonForm, teamId: team.id })}
                    className={`p-3 rounded-xl border text-center font-bold text-sm transition-colors ${
                      seasonForm.teamId === team.id
                        ? "border-green-400 bg-green-400/10 text-green-400"
                        : "border-white/10 hover:border-white/30 text-gray-400"
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-black rounded-xl p-4 text-sm text-gray-500 border border-white/5">
            <p className="font-bold text-white mb-1">결제 안내</p>
            <p>신청 완료 후 아래 계좌로 입금해주세요.</p>
            <p className="text-green-400 font-bold mt-2">카카오뱅크 000-0000-0000 (홍길동)</p>
            <p className="mt-1">입금자명: 선수 이름으로 입금 부탁드립니다.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("player")}
              className="flex-1 border border-white/10 text-gray-400 font-bold py-3 rounded-xl hover:border-white/30 transition-colors"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={loading || !seasonForm.seasonId || (selectedType === "SEASON" && !seasonForm.teamId)}
              className="flex-1 bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {loading ? "신청 중..." : "신청 완료"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
