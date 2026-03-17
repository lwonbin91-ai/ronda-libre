"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function StatsEditor({ reg, scheduleId, onSave }: {
  reg: { id: string; goals: number; assists: number };
  scheduleId: string;
  onSave: (goals: number, assists: number) => void;
}) {
  const [goals, setGoals] = useState(reg.goals ?? 0);
  const [assists, setAssists] = useState(reg.assists ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/schedules/${scheduleId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: reg.id, goals, assists }),
    });
    setSaving(false);
    setSaved(true);
    onSave(goals, assists);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] text-gray-600 mb-1 block">골</label>
          <input
            type="number" min={0} max={20}
            value={goals}
            onChange={(e) => setGoals(parseInt(e.target.value) || 0)}
            className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-600 mb-1 block">어시스트</label>
          <input
            type="number" min={0} max={20}
            value={assists}
            onChange={(e) => setAssists(parseInt(e.target.value) || 0)}
            className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-400"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`shrink-0 text-xs font-black px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${saved ? "bg-green-400/20 text-green-400 border border-green-400/30" : "bg-green-400 text-black hover:bg-green-300"}`}
        >
          {saving ? "저장 중" : saved ? "✓ 저장됨" : "저장하기"}
        </button>
      </div>
    </div>
  );
}

/* ───── types ───── */
interface Schedule {
  id: string;
  title: string;
  type: string;
  level: string;
  gradeLevel: string;
  gameFormat: string;
  scheduledAt: string;
  location: string | null;
  description: string | null;
  fee: number;
  maxPlayers: number;
  status: string;
  videoUrl: string | null;
  videoTitle: string | null;
  recruitmentStart: string | null;
  recruitmentEnd: string | null;
  _count: { registrations: number };
}

interface ScheduleTeam {
  id: string;
  name: string;
  color: string;
  maxPlayers: number;
  _count: { registrations: number };
}

interface ScheduleReg {
  id: string;
  status: string;
  isGK: boolean;
  isMVP: boolean;
  isFairplay: boolean;
  teamLabel?: string;
  jerseyNumber?: string;
  goals: number;
  assists: number;
  fee: number;
  paidAt: string | null;
  player: {
    id: string; name: string; school: string; birthYear: number;
    position: string | null; parentName: string; parentPhone: string; parentEmail: string;
    yearsExp: number | null;
  };
}

type Tab = "schedules" | "registrations" | "matches" | "players" | "announcements" | "stats";

const inputCls = "w-full bg-black border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-green-400/60 transition-colors";
const labelCls = "block text-xs text-gray-600 mb-1.5 font-medium";

const LEVEL_OPTS = [
  { value: "ALL", label: "전체 (레벨 무관)" },
  { value: "U1", label: "1년차까지" },
  { value: "U2", label: "2년차까지" },
  { value: "U3", label: "3년차까지" },
  { value: "U4", label: "4년차까지" },
  { value: "U5", label: "5년차까지" },
  { value: "U6", label: "6년차까지" },
  { value: "U7", label: "7년차까지" },
  { value: "U8", label: "8년차까지" },
  { value: "U9", label: "9년차까지" },
  { value: "U10", label: "10년차까지" },
];

const GRADE_OPTS = [
  { value: "ALL", label: "전체 학년" },
  { value: "G12", label: "초등 1~2학년" },
  { value: "G34", label: "초등 3~4학년" },
  { value: "G45", label: "초등 4~5학년" },
  { value: "G56", label: "초등 5~6학년" },
  { value: "M1", label: "중학교 1학년" },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  const [tab, setTab] = useState<Tab>("schedules");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allPlayers, setAllPlayers] = useState<Array<{
    id: string; name: string; school: string; birthYear: number;
    position: string | null; parentPhone: string; parentEmail: string;
    scheduleRegs: Array<{ id: string; schedule: { type: string } }>;
  }>>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [regs, setRegs] = useState<ScheduleReg[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* schedule form */
  const [sf, setSf] = useState({
    title: "", type: "ONEDAY", description: "", location: "",
    maxPlayers: 20, fee: 25000, recruitmentStart: "", recruitmentEnd: "",
    level: "ALL", gameFormat: "5v5", gradeLevel: "ALL",
  });

  /* schedule edit */
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editSf, setEditSf] = useState({
    title: "", description: "", location: "", maxPlayers: 20, fee: 0,
    recruitmentStart: "", recruitmentEnd: "", status: "RECRUITING",
    level: "ALL", gameFormat: "5v5", gradeGroup: "ALL",
  });

  const toLocalInput = (utcStr: string | null) => {
    if (!utcStr) return "";
    const d = new Date(utcStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 16);
  };

  const toKST = (localStr: string) => {
    if (!localStr) return "";
    return localStr.length === 16 ? `${localStr}:00+09:00` : localStr;
  };

  const startEditSchedule = (s: Schedule) => {
    setEditingScheduleId(s.id);
    setEditSf({
      title: s.title,
      description: s.description || "",
      location: s.location || "",
      maxPlayers: s.maxPlayers,
      fee: s.fee,
      recruitmentStart: toLocalInput(s.recruitmentStart),
      recruitmentEnd: toLocalInput(s.recruitmentEnd),
      status: s.status,
      level: s.level || "ALL",
      gameFormat: s.gameFormat || "5v5",
      gradeGroup: s.gradeLevel || "ALL",
    });
  };

  const saveEditSchedule = async (id: string) => {
    const body = {
      ...editSf,
      gradeLevel: editSf.gradeGroup,
      maxPlayers: parseInt(String(editSf.maxPlayers)),
      fee: parseInt(String(editSf.fee)),
      recruitmentStart: editSf.recruitmentStart ? toKST(editSf.recruitmentStart) : null,
      recruitmentEnd: editSf.recruitmentEnd ? toKST(editSf.recruitmentEnd) : null,
    };
    const res = await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setSchedules((prev) => prev.map((s) =>
        s.id === id
          ? { ...s, ...updated, level: updated.level ?? body.level, gameFormat: updated.gameFormat ?? body.gameFormat, gradeGroup: updated.gradeLevel ?? body.gradeLevel }
          : s
      ));
      setEditingScheduleId(null);
    }
  };

  /* season dates - multiple dates for SEASON type */
  const [seasonDates, setSeasonDates] = useState<string[]>([""]);

  /* team management */
  const [teamsBySchedule, setTeamsBySchedule] = useState<Record<string, ScheduleTeam[]>>({});
  const [expandedTeamSchedule, setExpandedTeamSchedule] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", color: "#4ade80", maxPlayers: 10 });
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [assigningTeam, setAssigningTeam] = useState<Record<string, string>>({});

  const assignTeam = async (regId: string, scheduleId: string, teamLabel: string) => {
    setAssigningTeam((prev) => ({ ...prev, [regId]: teamLabel }));
    const res = await fetch(`/api/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLabel }),
    });
    if (res.ok) {
      setRegs((prev) => prev.map((r) => r.id === regId ? { ...r, teamLabel } : r));
    }
    setAssigningTeam((prev) => { const n = { ...prev }; delete n[regId]; return n; });
  };

  const assignJersey = async (regId: string, jerseyNumber: string) => {
    const res = await fetch(`/api/registrations/${regId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jerseyNumber }),
    });
    if (res.ok) {
      setRegs((prev) => prev.map((r) => r.id === regId ? { ...r, jerseyNumber } : r));
    }
  };

  /* video form */
  const [vf, setVf] = useState({ scheduleId: "", videoUrl: "", videoTitle: "" });

  /* announcements */
  const [announcements, setAnnouncements] = useState<Array<{
    id: string; title: string; content: string; isPinned: boolean; createdAt: string; author: { name: string };
  }>>([]);
  const [af, setAf] = useState({ title: "", content: "", isPinned: false });
  const [savingAnnounce, setSavingAnnounce] = useState(false);
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const [editAf, setEditAf] = useState({ title: "", content: "", isPinned: false });

  /* stats */
  const [statsData, setStatsData] = useState<{
    totalPlayers: number; totalSchedules: number; totalRevenue: number;
    monthlyStats: Array<{ label: string; revenue: number; registrations: number }>;
    recentSchedules: Array<{ id: string; title: string; type: string; status: string; scheduledAt: string; _count: { registrations: number } }>;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && user?.role !== "ADMIN") { router.push("/"); return; }
    if (status === "authenticated") {
      fetch("/api/schedules")
        .then((r) => r.json())
        .then((d) => { setSchedules(Array.isArray(d) ? d : []); setLoading(false); });
      fetch("/api/players")
        .then((r) => r.json())
        .then((d) => setAllPlayers(Array.isArray(d) ? d : []));
      fetch("/api/announcements")
        .then((r) => r.json())
        .then((d) => setAnnouncements(Array.isArray(d) ? d : []));
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => setStatsData(d?.totalPlayers !== undefined ? d : null));
    }
  }, [status, user, router]);

  const loadRegs = async (s: Schedule) => {
    setSelectedSchedule(s);
    setTab("registrations");
    setLoadingRegs(true);
    const res = await fetch(`/api/schedules/${s.id}/registrations`, { credentials: "include" });
    const data = await res.json();
    setRegs(Array.isArray(data) ? data : []);
    setLoadingRegs(false);
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const dates = sf.type === "SEASON"
      ? seasonDates.filter(Boolean)
      : [""];  // ONEDAY uses no date from the dates array — handled below

    if (sf.type === "SEASON" && dates.length === 0) {
      setMsg("경기 날짜를 1개 이상 추가하세요.");
      setSubmitting(false);
      return;
    }

    try {
      if (sf.type === "SEASON") {
        const results = await Promise.all(
          dates.map((d) =>
            fetch("/api/schedules", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...sf,
                scheduledAt: toKST(d),
                recruitmentStart: sf.recruitmentStart ? toKST(sf.recruitmentStart) : undefined,
                recruitmentEnd: sf.recruitmentEnd ? toKST(sf.recruitmentEnd) : undefined,
              }),
            }).then((r) => r.json())
          )
        );
        const newSchedules = results.filter((r) => r.id);
        setSchedules([...newSchedules, ...schedules]);
        setMsg(`✓ 시즌 경기 ${newSchedules.length}일 등록 완료`);
        setSeasonDates([""]);
      } else {
        // ONEDAY needs a single date from seasonDates[0]
        const singleDate = seasonDates[0];
        if (!singleDate) {
          setMsg("경기 일시를 입력하세요.");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...sf,
            scheduledAt: toKST(singleDate),
            recruitmentStart: sf.recruitmentStart ? toKST(sf.recruitmentStart) : undefined,
            recruitmentEnd: sf.recruitmentEnd ? toKST(sf.recruitmentEnd) : undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSchedules([data, ...schedules]);
          setMsg("✓ 스케줄이 등록되었습니다.");
          setSeasonDates([""]);
        }
      }

      setSf({ title: "", type: "ONEDAY", description: "", location: "", maxPlayers: 20, fee: 25000, recruitmentStart: "", recruitmentEnd: "", level: "ALL", gameFormat: "5v5", gradeLevel: "ALL" });
      setTimeout(() => setMsg(""), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const loadTeams = async (scheduleId: string) => {
    if (teamsBySchedule[scheduleId]) {
      setExpandedTeamSchedule(expandedTeamSchedule === scheduleId ? null : scheduleId);
      return;
    }
    setLoadingTeams(true);
    setExpandedTeamSchedule(scheduleId);
    const res = await fetch(`/api/schedules/${scheduleId}/teams`);
    const data = await res.json();
    setTeamsBySchedule({ ...teamsBySchedule, [scheduleId]: Array.isArray(data) ? data : [] });
    setLoadingTeams(false);
  };

  const addTeam = async (scheduleId: string) => {
    if (!newTeam.name) return;
    const res = await fetch(`/api/schedules/${scheduleId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTeam),
    });
    const team = await res.json();
    if (team.id) {
      setTeamsBySchedule({
        ...teamsBySchedule,
        [scheduleId]: [...(teamsBySchedule[scheduleId] || []), team],
      });
      setNewTeam({ name: "", color: "#4ade80", maxPlayers: 10 });
    }
  };

  const deleteTeam = async (scheduleId: string, teamId: string) => {
    if (!confirm("팀을 삭제할까요?")) return;
    await fetch(`/api/schedules/${scheduleId}/teams`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    setTeamsBySchedule({
      ...teamsBySchedule,
      [scheduleId]: (teamsBySchedule[scheduleId] || []).filter((t) => t.id !== teamId),
    });
  };

  const deletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`${playerName} 선수를 탈퇴 처리하시겠습니까?\n경기 신청 내역과 입단 제의도 모두 삭제됩니다.`)) return;
    const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
    if (res.ok) {
      setAllPlayers(allPlayers.filter((p) => p.id !== playerId));
      setMsg(`✓ ${playerName} 선수가 탈퇴 처리되었습니다.`);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vf.scheduleId) return;
    const res = await fetch(`/api/schedules/${vf.scheduleId}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: vf.videoUrl, videoTitle: vf.videoTitle }),
    });
    if (res.ok) {
      setSchedules(schedules.map((s) => s.id === vf.scheduleId
        ? { ...s, videoUrl: vf.videoUrl, videoTitle: vf.videoTitle }
        : s));
      setMsg("✓ 영상 등록 완료. 경기 신청자 전원이 볼 수 있습니다.");
      setVf({ ...vf, videoUrl: "", videoTitle: "" });
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const deleteVideo = async (scheduleId: string) => {
    if (!confirm("영상을 삭제할까요?")) return;
    await fetch(`/api/schedules/${scheduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: null, videoTitle: null }),
    });
    setSchedules(schedules.map((s) => s.id === scheduleId ? { ...s, videoUrl: null, videoTitle: null } : s));
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("스케줄을 삭제하면 참가자 정보도 모두 삭제됩니다. 계속할까요?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSchedules(schedules.filter((s) => s.id !== id));
      if (selectedSchedule?.id === id) setSelectedSchedule(null);
    }
  };

  const confirmReg = async (regId: string, scheduleId: string) => {
    const res = await fetch(`/api/schedules/${scheduleId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ registrationId: regId, status: "CONFIRMED" }),
    });
    if (res.ok) {
      setRegs(regs.map((r) => r.id === regId ? { ...r, status: "CONFIRMED", paidAt: new Date().toISOString() } : r));
    }
  };

  const toggleRegAward = async (regId: string, scheduleId: string, field: "isMVP" | "isFairplay", current: boolean) => {
    await fetch(`/api/schedules/${scheduleId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, [field]: !current }),
    });
    setRegs(regs.map((r) => r.id === regId ? { ...r, [field]: !current } : r));
  };

  const closeSchedule = async (id: string) => {
    await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setSchedules(schedules.map((s) => s.id === id ? { ...s, status: "CLOSED" } : s));
  };

  const openSchedule = async (id: string) => {
    await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RECRUITING", recruitmentStart: null }),
    });
    setSchedules(schedules.map((s) => s.id === id ? { ...s, status: "RECRUITING", recruitmentStart: null } : s));
  };

  const resetVotes = async (id: string, title: string) => {
    if (!confirm(`"${title}" 경기의 모든 투표를 초기화하시겠습니까?\n\n참가 선수들이 다시 MVP/페어플레이 투표를 진행할 수 있습니다.`)) return;
    const res = await fetch(`/api/schedules/${id}/vote-reset`, { method: "DELETE" });
    if (res.ok) {
      alert("투표가 초기화되었습니다. 선수들이 재투표할 수 있습니다.");
    } else {
      alert("초기화 실패. 다시 시도해주세요.");
    }
  };

  const endSchedule = async (id: string, title: string) => {
    if (!confirm(`"${title}" 경기를 경기끝 상태로 변경하면 참가 선수들이 MVP/페어플레이 투표를 진행할 수 있습니다. 계속하시겠습니까?`)) return;
    await fetch(`/api/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENDED" }),
    });
    setSchedules(schedules.map((s) => s.id === id ? { ...s, status: "ENDED" } : s));
  };

  const cancelSchedule = async (id: string, title: string) => {
    const reason = prompt(`"${title}" 경기를 취소하는 이유를 입력하세요:`);
    if (reason === null) return;
    const res = await fetch(`/api/schedules/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || "운영상의 사유" }),
    });
    const data = await res.json();
    if (data.ok) {
      setSchedules(schedules.map((s) => s.id === id ? { ...s, status: "CANCELLED" } : s));
      setMsg(`✓ 경기가 취소되었습니다. ${data.notified}명에게 알림 발송.`);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalRegs = schedules.reduce((s, x) => s + x._count.registrations, 0);

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-green-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">ADMIN</p>
          <h1 className="text-3xl font-black tracking-tight">관리자 대시보드</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "전체 스케줄", value: schedules.length },
            { label: "모집 중", value: schedules.filter((s) => s.status === "RECRUITING").length },
            { label: "총 신청", value: totalRegs },
            { label: "영상 등록", value: schedules.filter((s) => s.videoUrl).length },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div className="bg-green-400/10 border border-green-400/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-6">
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl mb-8 overflow-x-auto">
          {([
            { key: "schedules", label: "경기 등록 & 관리" },
            { key: "registrations", label: `참가자${selectedSchedule ? ` · ${selectedSchedule.title.slice(0, 8)}` : ""}` },
            { key: "matches", label: "영상 등록" },
            { key: "players", label: `선수 관리 (${allPlayers.length})` },
            { key: "announcements", label: "공지사항" },
            { key: "stats", label: "통계" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-white text-black" : "text-gray-500 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 경기 등록 탭 ── */}
        {tab === "schedules" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <form onSubmit={createSchedule} className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-5">새 경기 스케줄 등록</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>제목</label>
                  <input required value={sf.title} onChange={(e) => setSf({ ...sf, title: e.target.value })}
                    className={inputCls} placeholder="2026 봄 시즌 U12" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>경기 유형</label>
                    <select value={sf.type} onChange={(e) => {
                      setSf({ ...sf, type: e.target.value, fee: e.target.value === "SEASON" ? 89000 : 25000 });
                      if (e.target.value === "ONEDAY") setSeasonDates([""]);
                    }} className={inputCls}>
                      <option value="ONEDAY">오픈 매칭 (25,000)</option>
                      <option value="SEASON">시즌 리그 (89,000)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>경기 방식</label>
                    <select value={sf.gameFormat} onChange={(e) => setSf({ ...sf, gameFormat: e.target.value })} className={inputCls}>
                      <option value="5v5">5 vs 5 풋살</option>
                      <option value="8v8">8 vs 8 축구</option>
                      <option value="6v6">6 vs 6</option>
                      <option value="7v7">7 vs 7</option>
                    </select>
                  </div>
                </div>
                <div>
                    <label className={labelCls}>레벨</label>
                    <select value={sf.level} onChange={(e) => setSf({ ...sf, level: e.target.value })} className={inputCls}>
                      {LEVEL_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                <div>
                    <label className={labelCls}>학년</label>
                    <select value={sf.gradeLevel} onChange={(e) => setSf({ ...sf, gradeLevel: e.target.value })} className={inputCls}>
                      {GRADE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                {/* 경기 날짜 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`${labelCls} mb-0`}>
                      {sf.type === "SEASON" ? "경기 날짜 (여러 개 추가 가능)" : "경기 일시"}
                    </label>
                    {sf.type === "SEASON" && (
                      <button
                        type="button"
                        onClick={() => setSeasonDates([...seasonDates, ""])}
                        className="text-xs text-green-400 hover:text-green-300 font-bold"
                      >
                        + 날짜 추가
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {seasonDates.map((d, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="datetime-local"
                          value={d}
                          onChange={(e) => {
                            const next = [...seasonDates];
                            next[i] = e.target.value;
                            setSeasonDates(next);
                          }}
                          className={`${inputCls} flex-1 [color-scheme:dark]`}
                          required={i === 0}
                        />
                        {sf.type === "SEASON" && seasonDates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSeasonDates(seasonDates.filter((_, idx) => idx !== i))}
                            className="text-gray-600 hover:text-red-400 transition-colors px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {sf.type === "SEASON" && seasonDates.filter(Boolean).length > 0 && (
                    <p className="text-[10px] text-green-400/60 mt-1.5">
                      {seasonDates.filter(Boolean).length}개 경기 일정 등록 예정
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>최대 인원</label>
                    <input type="number" min={2} value={sf.maxPlayers}
                      onChange={(e) => setSf({ ...sf, maxPlayers: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>참가비 (원)</label>
                    <input type="number" value={sf.fee}
                      onChange={(e) => setSf({ ...sf, fee: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>장소</label>
                  <input value={sf.location} onChange={(e) => setSf({ ...sf, location: e.target.value })}
                    className={inputCls} placeholder="○○풋살장" />
                </div>

                {sf.type === "SEASON" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>모집 시작일</label>
                      <input type="datetime-local" value={sf.recruitmentStart}
                        onChange={(e) => setSf({ ...sf, recruitmentStart: e.target.value })} className={`${inputCls} [color-scheme:dark]`} />
                    </div>
                    <div>
                      <label className={labelCls}>모집 마감일</label>
                      <input type="datetime-local" value={sf.recruitmentEnd}
                        onChange={(e) => setSf({ ...sf, recruitmentEnd: e.target.value })} className={`${inputCls} [color-scheme:dark]`} />
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelCls}>설명 (선택)</label>
                  <textarea rows={3} value={sf.description}
                    onChange={(e) => setSf({ ...sf, description: e.target.value })}
                    className={`${inputCls} resize-none`} placeholder="경기 상세 안내" />
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="mt-5 w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors text-sm disabled:opacity-50">
                {submitting ? "등록 중..." : sf.type === "SEASON" ? `시즌 경기 ${seasonDates.filter(Boolean).length}일 등록` : "스케줄 등록"}
              </button>
            </form>

            {/* Schedule list */}
            <div>
              <h2 className="font-black text-lg mb-4">등록된 스케줄 ({schedules.length})</h2>
              <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
                {schedules.length === 0 && (
                  <p className="text-gray-700 text-sm py-8 text-center">등록된 스케줄이 없습니다.</p>
                )}
                {schedules.map((s) => (
                  <div key={s.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            s.status === "RECRUITING"
                              ? "border-green-400/25 text-green-400 bg-green-400/5"
                              : s.status === "CANCELLED"
                              ? "border-red-400/25 text-red-400 bg-red-400/5"
                              : s.status === "ENDED"
                              ? "border-purple-400/25 text-purple-400 bg-purple-400/5"
                              : "border-white/8 text-gray-600"
                          }`}>
                            {s.status === "RECRUITING" ? "모집 중" : s.status === "CLOSED" ? "마감" : s.status === "CANCELLED" ? "취소됨" : s.status === "ENDED" ? "경기끝" : "완료"}
                          </span>
                          <span className="text-[10px] text-gray-700">{s.type === "SEASON" ? "시즌" : "오픈"}</span>
                          {s.gameFormat && (
                            <span className="text-[10px] text-gray-600">{s.gameFormat.replace("v", " vs ")}</span>
                          )}
                          {s.level && s.level !== "ALL" && (
                            <span className="text-[10px] text-blue-400/70">{LEVEL_OPTS.find(o => o.value === s.level)?.label}</span>
                          )}
                          {s.gradeLevel && s.gradeLevel !== "ALL" && (
                            <span className="text-[10px] text-purple-400/70">{GRADE_OPTS.find(o => o.value === s.gradeLevel)?.label}</span>
                          )}
                          {s.videoUrl && <span className="text-[10px] text-green-400/60">▶ 영상</span>}
                        </div>
                        <p className="font-bold text-sm truncate">{s.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(s.scheduledAt).toLocaleDateString("ko-KR")} · {s._count.registrations}/{s.maxPlayers}명 · {s.fee.toLocaleString()}원
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                        <button onClick={() => loadRegs(s)}
                          className="text-xs border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg hover:border-green-400/30 hover:text-green-400 transition-colors">
                          참가자 ({s._count.registrations})
                        </button>
                        <button onClick={() => startEditSchedule(s)}
                          className="text-xs border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg hover:border-blue-400/30 hover:text-blue-400 transition-colors">
                          수정
                        </button>
                        {s.type === "SEASON" && (
                          <button onClick={() => loadTeams(s.id)}
                            className={`text-xs border px-2.5 py-1.5 rounded-lg transition-colors ${
                              expandedTeamSchedule === s.id
                                ? "border-green-400/40 text-green-400"
                                : "border-white/10 text-gray-400 hover:border-green-400/30 hover:text-green-400"
                            }`}>
                            팀 관리
                          </button>
                        )}
                        {(s.status !== "RECRUITING" || (s.recruitmentStart && new Date(s.recruitmentStart) > new Date())) && s.status !== "COMPLETED" && s.status !== "CANCELLED" && (
                          <button onClick={() => openSchedule(s.id)}
                            className="text-xs border border-green-400/30 text-green-400 px-2.5 py-1.5 rounded-lg hover:bg-green-400/10 transition-colors font-bold">
                            모집 오픈
                          </button>
                        )}
                        {s.status !== "CANCELLED" && s.status !== "ENDED" && (
                          <>
                            {s.status === "RECRUITING" && (
                              <button onClick={() => closeSchedule(s.id)}
                                className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-yellow-400/30 hover:text-yellow-400 transition-colors">
                                마감
                              </button>
                            )}
                            <button onClick={() => endSchedule(s.id, s.title)}
                              className="text-xs border border-purple-400/30 text-purple-400 px-2.5 py-1.5 rounded-lg hover:bg-purple-400/10 transition-colors font-bold">
                              경기끝
                            </button>
                            <button onClick={() => cancelSchedule(s.id, s.title)}
                              className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-orange-400/30 hover:text-orange-400 transition-colors">
                              취소
                            </button>
                          </>
                        )}
                        <button onClick={() => deleteSchedule(s.id)}
                          className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-red-400/30 hover:text-red-400 transition-colors">
                          삭제
                        </button>
                        {s.status === "ENDED" && (
                          <button onClick={() => resetVotes(s.id, s.title)}
                            className="text-xs border border-red-400/30 text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors font-bold">
                            투표 초기화
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 스케줄 수정 패널 */}
                    {editingScheduleId === s.id && (
                      <div className="mt-3 pt-3 border-t border-white/6">
                        <p className="text-xs font-bold text-blue-400 mb-3">스케줄 수정</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">제목</label>
                            <input value={editSf.title} onChange={(e) => setEditSf({ ...editSf, title: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">장소</label>
                            <input value={editSf.location} onChange={(e) => setEditSf({ ...editSf, location: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">최대 인원</label>
                            <input type="number" value={editSf.maxPlayers} onChange={(e) => setEditSf({ ...editSf, maxPlayers: parseInt(e.target.value) })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">참가비 (원)</label>
                            <input type="number" value={editSf.fee} onChange={(e) => setEditSf({ ...editSf, fee: parseInt(e.target.value) })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">경기 시작 시간</label>
                            <input type="datetime-local" value={editSf.recruitmentStart} onChange={(e) => setEditSf({ ...editSf, recruitmentStart: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">경기 종료 시간</label>
                            <input type="datetime-local" value={editSf.recruitmentEnd} onChange={(e) => setEditSf({ ...editSf, recruitmentEnd: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400" />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="text-[10px] text-gray-500 mb-1 block">설명</label>
                          <textarea value={editSf.description} onChange={(e) => setEditSf({ ...editSf, description: e.target.value })} rows={2}
                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 resize-none" />
                        </div>
                        <div className="mb-3">
                          <label className="text-[10px] text-gray-500 mb-1 block">상태</label>
                          <select value={editSf.status} onChange={(e) => setEditSf({ ...editSf, status: e.target.value })}
                            className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                            <option value="RECRUITING">모집 중</option>
                            <option value="CLOSED">마감</option>
                            <option value="COMPLETED">완료</option>
                            <option value="CANCELLED">취소</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">레벨</label>
                            <select value={editSf.level} onChange={(e) => setEditSf({ ...editSf, level: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                              <option value="ALL">레벨 무관</option>
                              <option value="U1">1년차까지</option>
                              <option value="U2">2년차까지</option>
                              <option value="U3">3년차까지</option>
                              <option value="U4">4년차까지</option>
                              <option value="U5">5년차까지</option>
                              <option value="U6">6년차까지</option>
                              <option value="U7">7년차까지</option>
                              <option value="U8">8년차까지</option>
                              <option value="U9">9년차까지</option>
                              <option value="U10">10년차까지</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">경기 방식</label>
                            <select value={editSf.gameFormat} onChange={(e) => setEditSf({ ...editSf, gameFormat: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                              <option value="5v5">5 vs 5 풋살</option>
                              <option value="8v8">8 vs 8 축구</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">학년</label>
                            <select value={editSf.gradeGroup} onChange={(e) => setEditSf({ ...editSf, gradeGroup: e.target.value })}
                              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400">
                              <option value="ALL">전체 학년</option>
                              <option value="G12">초등 1~2학년</option>
                              <option value="G34">초등 3~4학년</option>
                              <option value="G45">초등 4~5학년</option>
                              <option value="G56">초등 5~6학년</option>
                              <option value="M1">중학교 1학년</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEditSchedule(s.id)}
                            className="text-xs bg-blue-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors">
                            저장
                          </button>
                          <button onClick={() => setEditingScheduleId(null)}
                            className="text-xs border border-white/10 text-gray-500 px-4 py-2 rounded-lg hover:border-white/25">
                            취소
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 팀 관리 패널 */}
                    {expandedTeamSchedule === s.id && (
                      <div className="mt-3 pt-3 border-t border-white/6">
                        <p className="text-xs text-gray-600 font-bold mb-3">팀 목록</p>
                        {loadingTeams ? (
                          <p className="text-xs text-gray-700">불러오는 중...</p>
                        ) : (
                          <div className="space-y-2 mb-3">
                            {(teamsBySchedule[s.id] || []).length === 0 ? (
                              <p className="text-xs text-gray-700">등록된 팀이 없습니다.</p>
                            ) : (
                              (teamsBySchedule[s.id] || []).map((t) => (
                                <div key={t.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                                    <span className="text-sm font-bold">{t.name}</span>
                                    <span className="text-xs text-gray-600">{t._count.registrations}/{t.maxPlayers}명</span>
                                  </div>
                                  <button onClick={() => deleteTeam(s.id, t.id)}
                                    className="text-xs text-gray-700 hover:text-red-400 transition-colors">삭제</button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <input
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            placeholder="팀 이름"
                            className="flex-1 min-w-0 bg-black border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-green-400/60"
                          />
                          <input
                            type="color"
                            value={newTeam.color}
                            onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-white/8 bg-black cursor-pointer"
                          />
                          <input
                            type="number" min={2} max={30} value={newTeam.maxPlayers}
                            onChange={(e) => setNewTeam({ ...newTeam, maxPlayers: parseInt(e.target.value) })}
                            className="w-16 bg-black border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-green-400/60"
                          />
                          <button
                            onClick={() => addTeam(s.id)}
                            className="bg-green-400 text-black text-xs font-black px-3 py-1.5 rounded-lg hover:bg-green-300 transition-colors"
                          >
                            팀 추가
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-700 mt-1.5">색상 · 최대인원 순서로 입력</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 참가자 관리 탭 ── */}
        {tab === "registrations" && (
          <div>
            {!selectedSchedule ? (
              <div className="text-center py-16 text-gray-700">
                <p className="text-sm">왼쪽 경기 등록 탭에서 경기를 선택해 참가자를 확인하세요.</p>
                <button onClick={() => setTab("schedules")}
                  className="mt-4 text-sm text-green-400 hover:underline">
                  경기 목록으로 →
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-black text-xl">{selectedSchedule.title}</h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {new Date(selectedSchedule.scheduledAt).toLocaleDateString("ko-KR")} · {regs.length}명 신청
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => selectedSchedule && loadRegs(selectedSchedule)}
                      className="text-xs text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">
                      ↻ 새로고침
                    </button>
                    <button onClick={() => setTab("schedules")}
                      className="text-xs text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg">
                      ← 목록
                    </button>
                  </div>
                </div>

                {loadingRegs ? (
                  <div className="text-center py-8 text-gray-600 text-sm">불러오는 중...</div>
                ) : regs.length === 0 ? (
                  <div className="text-center py-16 text-gray-700 text-sm">아직 신청자가 없습니다.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-xl font-black">{regs.filter(r => r.status === "CONFIRMED").length}</div>
                        <div className="text-xs text-gray-600 mt-0.5">입금 확인</div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                        <div className="text-xl font-black text-yellow-400">{regs.filter(r => r.status !== "CONFIRMED" && r.status !== "CANCELLED").length}</div>
                        <div className="text-xs text-gray-600 mt-0.5">입금 대기</div>
                      </div>
                    </div>
                    {regs.some(r => r.status !== "CONFIRMED" && r.status !== "CANCELLED" && r.fee === 0) && (
                      <button
                        onClick={async () => {
                          await fetch("/api/admin/confirm-free", { method: "POST", credentials: "include" });
                          if (selectedSchedule) loadRegs(selectedSchedule);
                        }}
                        className="w-full bg-green-500 text-black font-black text-sm py-2.5 rounded-xl hover:bg-green-400 transition-colors mb-2"
                      >
                        ✓ 무료(0원) 대기자 전체 확정
                      </button>
                    )}
                    {regs.map((reg) => (
                      <div key={reg.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-sm">{reg.player.name}</span>
                              {reg.isGK && (
                                <span className="text-[10px] font-bold text-green-400 border border-green-400/20 bg-green-400/5 px-1.5 py-0.5 rounded-full">
                                  🧤 GK 무료
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                reg.status === "CONFIRMED"
                                  ? "border-green-400/25 text-green-400 bg-green-400/5"
                                  : "border-yellow-400/25 text-yellow-400 bg-yellow-400/5"
                              }`}>
                                {reg.status === "CONFIRMED" ? "확정" : "대기"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {reg.player.birthYear}년생 · {reg.player.school}
                              {reg.player.position && ` · ${reg.player.position}`}
                              {reg.player.yearsExp && (
                                <span className="ml-1 text-green-400/70 font-bold">⚽ {reg.player.yearsExp}년차</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-700 mt-0.5">
                              보호자: {reg.player.parentName} · {reg.player.parentPhone} · {reg.player.parentEmail}
                            </p>
                            {!reg.isGK && (
                              <p className="text-xs text-gray-600 mt-0.5">참가비: {reg.fee.toLocaleString()}원</p>
                            )}
                          </div>
                          {reg.status !== "CONFIRMED" && (
                            <button
                              onClick={() => confirmReg(reg.id, selectedSchedule.id)}
                              className="text-xs bg-green-400 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-green-300 transition-colors shrink-0"
                            >
                              입금 확인
                            </button>
                          )}
                        </div>
                        {reg.status === "CONFIRMED" && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                            {/* 팀 배정 */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-gray-500 font-bold">팀 배정:</span>
                              {["A팀", "B팀", "C팀", "D팀", "미배정"].map((label) => (
                                <button
                                  key={label}
                                  disabled={!!assigningTeam[reg.id]}
                                  onClick={() => assignTeam(reg.id, selectedSchedule.id, label === "미배정" ? "" : label)}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                                    (reg.teamLabel || "") === (label === "미배정" ? "" : label)
                                      ? "bg-green-400/20 border-green-400/40 text-green-300"
                                      : "border-white/10 text-gray-600 hover:border-white/25 hover:text-gray-400"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            {/* 등번호 배정 */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-bold shrink-0">등번호:</span>
                              <input
                                type="number"
                                min={1} max={99}
                                defaultValue={reg.jerseyNumber || ""}
                                placeholder="번호"
                                className="w-16 bg-black border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-400"
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  if (val !== (reg.jerseyNumber || "")) assignJersey(reg.id, val);
                                }}
                              />
                              {reg.jerseyNumber && (
                                <span className="text-[10px] text-blue-400 font-bold">#{reg.jerseyNumber}</span>
                              )}
                            </div>
                            {/* MVP/페어플레이 안내 */}
                            <p className="text-[10px] text-gray-700">⭐ MVP · 🤝 페어플레이는 경기 후 선수 투표로 진행됩니다.</p>
                          </div>
                        )}
                        {reg.status === "CONFIRMED" && (
                          <StatsEditor reg={reg} scheduleId={selectedSchedule.id} onSave={(goals, assists) =>
                            setRegs(regs.map((r) => r.id === reg.id ? { ...r, goals, assists } : r))
                          } />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 영상 등록 탭 ── */}
        {tab === "matches" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <form onSubmit={addVideo} className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-2">경기 영상 등록</h2>
              <p className="text-gray-600 text-xs mb-5">
                영상을 등록하면 해당 경기 신청자 전원이 볼 수 있고 영상 페이지에도 표시됩니다.
              </p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>경기 선택</label>
                  <select required value={vf.scheduleId}
                    onChange={(e) => setVf({ ...vf, scheduleId: e.target.value })} className={inputCls}>
                    <option value="">선택하세요</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({new Date(s.scheduledAt).toLocaleDateString("ko-KR")})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>영상 URL</label>
                  <input required value={vf.videoUrl}
                    onChange={(e) => setVf({ ...vf, videoUrl: e.target.value })}
                    className={inputCls}
                    placeholder="https://app.veo.co/matches/... 또는 YouTube URL" />
                  <p className="text-[10px] text-gray-700 mt-1">YouTube, Veo 링크 자동 임베드</p>
                </div>
                <div>
                  <label className={labelCls}>영상 제목 (선택)</label>
                  <input value={vf.videoTitle}
                    onChange={(e) => setVf({ ...vf, videoTitle: e.target.value })}
                    className={inputCls} placeholder="하이라이트 / 풀경기" />
                </div>
              </div>
              <button type="submit"
                className="mt-5 w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors text-sm">
                영상 등록
              </button>
            </form>

            {/* 영상 목록 + 삭제 */}
            <div>
              <h2 className="font-black text-lg mb-4">등록된 영상 ({schedules.filter(s => s.videoUrl).length})</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {schedules.filter((s) => s.videoUrl).length === 0 && (
                  <p className="text-gray-700 text-sm py-8 text-center">등록된 영상이 없습니다.</p>
                )}
                {schedules.filter((s) => s.videoUrl).map((s) => (
                  <div key={s.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm">{s.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(s.scheduledAt).toLocaleDateString("ko-KR")}
                          {s.videoTitle && ` · ${s.videoTitle}`}
                        </p>
                        <p className="text-xs text-gray-700 mt-0.5 truncate">{s.videoUrl}</p>
                      </div>
                      <button
                        onClick={() => deleteVideo(s.id)}
                        className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-red-400/30 hover:text-red-400 transition-colors shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ── 공지사항 탭 ── */}
        {tab === "announcements" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
              <h2 className="font-black text-lg mb-5">공지사항 작성</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>제목</label>
                  <input value={af.title} onChange={(e) => setAf({ ...af, title: e.target.value })}
                    className={inputCls} placeholder="공지 제목을 입력하세요" />
                </div>
                <div>
                  <label className={labelCls}>내용</label>
                  <textarea value={af.content} onChange={(e) => setAf({ ...af, content: e.target.value })}
                    rows={6} className={`${inputCls} resize-none`} placeholder="공지 내용을 입력하세요" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={af.isPinned} onChange={(e) => setAf({ ...af, isPinned: e.target.checked })}
                    className="w-4 h-4 accent-green-400" />
                  <span className="text-sm text-gray-400">상단 고정</span>
                </label>
                <button
                  disabled={savingAnnounce || !af.title || !af.content}
                  onClick={async () => {
                    setSavingAnnounce(true);
                    const res = await fetch("/api/announcements", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(af),
                    });
                    const data = await res.json();
                    if (data.id) {
                      setAnnouncements([data, ...announcements]);
                      setAf({ title: "", content: "", isPinned: false });
                      setMsg("✓ 공지사항이 등록되었습니다.");
                      setTimeout(() => setMsg(""), 3000);
                    }
                    setSavingAnnounce(false);
                  }}
                  className="w-full bg-green-400 text-black font-black py-2.5 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-40"
                >
                  {savingAnnounce ? "등록 중..." : "공지사항 등록"}
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-black text-lg mb-4">등록된 공지사항 ({announcements.length})</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {announcements.length === 0 && (
                  <p className="text-gray-700 text-sm py-8 text-center">등록된 공지사항이 없습니다.</p>
                )}
                {announcements.map((a) => (
                  <div key={a.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                    {editingAnnounceId === a.id ? (
                      <div className="space-y-3">
                        <input
                          value={editAf.title}
                          onChange={(e) => setEditAf({ ...editAf, title: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
                          placeholder="제목"
                        />
                        <textarea
                          value={editAf.content}
                          onChange={(e) => setEditAf({ ...editAf, content: e.target.value })}
                          rows={4}
                          className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400 resize-none"
                          placeholder="내용"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`pin-edit-${a.id}`}
                            checked={editAf.isPinned}
                            onChange={(e) => setEditAf({ ...editAf, isPinned: e.target.checked })}
                            className="accent-green-400"
                          />
                          <label htmlFor={`pin-edit-${a.id}`} className="text-xs text-gray-400">상단 고정</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/announcements/${a.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(editAf),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setAnnouncements(announcements.map((x) => x.id === a.id ? { ...x, ...updated } : x));
                                setEditingAnnounceId(null);
                              }
                            }}
                            className="text-xs bg-blue-500/20 border border-blue-400/30 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition-colors font-bold"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingAnnounceId(null)}
                            className="text-xs border border-white/10 text-gray-500 px-3 py-1.5 rounded-lg hover:text-white transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {a.isPinned && (
                              <span className="text-[10px] font-black text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-0.5 rounded-full">공지</span>
                            )}
                            <p className="font-bold text-sm truncate">{a.title}</p>
                          </div>
                          <p className="text-xs text-gray-600">{new Date(a.createdAt).toLocaleDateString("ko-KR")}</p>
                          <p className="text-xs text-gray-700 mt-1 line-clamp-2">{a.content}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingAnnounceId(a.id);
                              setEditAf({ title: a.title, content: a.content, isPinned: a.isPinned });
                            }}
                            className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-blue-400/30 hover:text-blue-400 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("공지사항을 삭제하시겠습니까?")) return;
                              await fetch(`/api/announcements/${a.id}`, { method: "DELETE" });
                              setAnnouncements(announcements.filter((x) => x.id !== a.id));
                            }}
                            className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-red-400/30 hover:text-red-400 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 통계 탭 ── */}
        {tab === "stats" && (
          <div>
            <h2 className="font-black text-xl mb-6">관리자 대시보드 통계</h2>
            {!statsData ? (
              <div className="text-center py-20 text-gray-600">통계 데이터를 불러오는 중...</div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "총 선수 수", value: `${statsData.totalPlayers}명`, color: "text-green-400" },
                    { label: "총 경기 수", value: `${statsData.totalSchedules}개`, color: "text-blue-400" },
                    { label: "총 매출", value: `${statsData.totalRevenue.toLocaleString()}원`, color: "text-yellow-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 text-center">
                      <div className={`text-2xl font-black ${s.color} mb-1`}>{s.value}</div>
                      <div className="text-xs text-gray-600">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-6 mb-6">
                  <h3 className="font-black text-base mb-4">월별 매출 & 신청 현황 (최근 6개월)</h3>
                  <div className="space-y-3">
                    {statsData.monthlyStats.map((m) => {
                      const maxRev = Math.max(...statsData.monthlyStats.map((x) => x.revenue), 1);
                      return (
                        <div key={m.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-8 shrink-0">{m.label}</span>
                          <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-green-400/30 rounded-lg transition-all"
                              style={{ width: `${(m.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-green-400 font-bold w-24 text-right shrink-0">
                            {m.revenue.toLocaleString()}원
                          </span>
                          <span className="text-xs text-gray-600 w-12 text-right shrink-0">
                            {m.registrations}건
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/6 rounded-2xl p-6">
                  <h3 className="font-black text-base mb-4">최근 등록 경기</h3>
                  <div className="space-y-2">
                    {statsData.recentSchedules.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/4 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{s.title}</p>
                          <p className="text-xs text-gray-600">{new Date(s.scheduledAt).toLocaleDateString("ko-KR")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            s.type === "SEASON" ? "text-green-400 border-green-400/20 bg-green-400/8" : "text-blue-400 border-blue-400/20 bg-blue-400/8"
                          }`}>{s.type === "SEASON" ? "시즌" : "오픈"}</span>
                          <span className="text-xs text-gray-500">{s._count.registrations}명 신청</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 선수 관리 탭 ── */}
        {tab === "players" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-xl">선수 관리</h2>
                <p className="text-xs text-gray-600 mt-0.5">전체 선수 {allPlayers.length}명 · 탈퇴 처리 시 모든 기록이 삭제됩니다.</p>
              </div>
            </div>
            {allPlayers.length === 0 ? (
              <div className="text-center py-16 text-gray-700 text-sm">등록된 선수가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {allPlayers.map((p) => {
                  const seasonCount = p.scheduleRegs.filter((r) => r.schedule.type === "SEASON").length;
                  return (
                    <div key={p.id} className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{p.name}</span>
                            {p.position && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/20 text-green-400">
                                {p.position}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {p.birthYear}년생 · {p.school}
                          </p>
                          <p className="text-xs text-gray-700 mt-0.5">
                            {p.parentPhone} · {p.parentEmail}
                          </p>
                          <p className="text-[10px] text-gray-700 mt-0.5">
                            시즌 신청 {seasonCount}건 · 전체 {p.scheduleRegs.length}건
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <a href={`/players/${p.id}`} target="_blank"
                            className="text-xs border border-white/10 text-gray-400 px-2.5 py-1.5 rounded-lg hover:border-white/20 transition-colors">
                            프로필
                          </a>
                          <button
                            onClick={() => deletePlayer(p.id, p.name)}
                            className="text-xs border border-white/10 text-gray-500 px-2.5 py-1.5 rounded-lg hover:border-red-400/30 hover:text-red-400 transition-colors"
                          >
                            탈퇴
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
