"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use } from "react";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  position: string | null;
  school: string;
  jerseyNumber: string | null;
  teamLabel: string | null;
}

interface MyVote {
  id: string;
  voteType: string;
  targetId: string;
}

export default function VotePage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [teamGroups, setTeamGroups] = useState<Record<string, Participant[]>>({});
  const [myVotes, setMyVotes] = useState<MyVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/schedules/${scheduleId}/vote`)
      .then(async (r) => {
        const text = await r.text();
        if (!text) throw new Error("빈 응답");
        return JSON.parse(text);
      })
      .then((data) => {
        if (data.error) { setError(data.error); }
        else {
          setMyPlayerId(data.myPlayerId);
          setMyTeam(data.myTeam);
          setTeamGroups(data.teamGroups || {});
          setMyVotes(data.myVotes || []);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError("서버 연결 오류: " + e.message);
        setLoading(false);
      });
  }, [session, scheduleId]);

  const vote = async (targetId: string, voteType: "MVP" | "FAIRPLAY") => {
    setError("");
    const tempId = `temp-${Date.now()}`;
    setMyVotes((prev) => {
      const filtered = prev.filter((v) => v.voteType !== voteType);
      return [...filtered, { id: tempId, voteType, targetId }];
    });
    setSubmitting(true);
    const res = await fetch(`/api/schedules/${scheduleId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, voteType }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setMyVotes((prev) => {
        const updated = prev.map((v) => v.id === tempId ? data : v);
        const hasMvp = updated.some((v) => v.voteType === "MVP");
        const hasFp = updated.some((v) => v.voteType === "FAIRPLAY");
        if (hasMvp && hasFp) {
          if (typeof window !== "undefined") sessionStorage.setItem(`voted_${scheduleId}`, "done");
          router.refresh();
        }
        return updated;
      });
    } else {
      setMyVotes((prev) => prev.filter((v) => v.id !== tempId));
      setError(data.error || "오류 발생");
    }
  };

  const mvpVote = myVotes.find((v) => v.voteType === "MVP");
  const fairplayVote = myVotes.find((v) => v.voteType === "FAIRPLAY");
  const isCompleted = !!(mvpVote && fairplayVote);

  const myTeamPlayers = myTeam && teamGroups[myTeam]
    ? teamGroups[myTeam].filter((p) => p.id !== myPlayerId)
    : Object.values(teamGroups).flat().filter((p) => p.id !== myPlayerId);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>;

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xs text-gray-600 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors">
          ← 대시보드
        </Link>
        <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mt-5 mb-2">VOTE</p>
        <h1 className="text-3xl font-black">경기 투표</h1>
        {myTeam && (
          <div className="mt-2 inline-block bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg">
            내 팀: {myTeam}
          </div>
        )}
        <p className="text-gray-500 text-sm mt-2">
          {isCompleted
            ? "투표가 완료되었습니다. 재투표는 불가합니다."
            : "같은 팀 선수 중 MVP와 페어플레이 선수를 각 1명씩 선택해주세요. (자기 자신 제외)"}
        </p>
      </div>

      {isCompleted ? (
        <div className="bg-[#0d0d0d] border border-green-400/20 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-black text-green-400 mb-6">투표 완료</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4 bg-yellow-400/5 border border-yellow-400/15 rounded-xl p-4">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest mb-0.5">MVP</p>
                <p className="font-black text-lg">{myTeamPlayers.find((p) => p.id === mvpVote?.targetId)?.name || Object.values(teamGroups).flat().find(p => p.id === mvpVote?.targetId)?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-blue-400/5 border border-blue-400/15 rounded-xl p-4">
              <span className="text-2xl">🤝</span>
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-0.5">페어플레이</p>
                <p className="font-black text-lg">{myTeamPlayers.find((p) => p.id === fairplayVote?.targetId)?.name || Object.values(teamGroups).flat().find(p => p.id === fairplayVote?.targetId)?.name}</p>
              </div>
            </div>
          </div>
          <Link href="/dashboard"
            className="mt-6 inline-block bg-white/5 border border-white/10 text-gray-400 text-sm font-bold px-6 py-2.5 rounded-xl hover:border-white/20 transition-colors">
            대시보드로 돌아가기
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl p-4 mb-6">{error}</div>
          )}

          <div className="flex gap-3 mb-6">
            <div className={`flex-1 rounded-xl p-3 text-center border text-sm font-bold ${mvpVote ? "bg-yellow-400/10 border-yellow-400/25 text-yellow-300" : "bg-white/[0.02] border-white/8 text-gray-600"}`}>
              ⭐ MVP {mvpVote ? `→ ${myTeamPlayers.find((p) => p.id === mvpVote.targetId)?.name}` : "선택 전"}
            </div>
            <div className={`flex-1 rounded-xl p-3 text-center border text-sm font-bold ${fairplayVote ? "bg-blue-400/10 border-blue-400/25 text-blue-300" : "bg-white/[0.02] border-white/8 text-gray-600"}`}>
              🤝 페어플레이 {fairplayVote ? `→ ${myTeamPlayers.find((p) => p.id === fairplayVote.targetId)?.name}` : "선택 전"}
            </div>
          </div>

          {myTeam && (
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-400 mb-3">{myTeam} 선수 목록 (등번호 순)</h2>
            </div>
          )}

          {myTeamPlayers.length === 0 ? (
            <div className="text-center py-16 text-gray-600 text-sm">투표할 수 있는 같은 팀 선수가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {myTeamPlayers.map((p) => {
                const isMyMvp = mvpVote?.targetId === p.id;
                const isMyFairplay = fairplayVote?.targetId === p.id;
                return (
                  <div key={p.id} className={`bg-[#0d0d0d] border rounded-2xl p-5 transition-colors ${isMyMvp || isMyFairplay ? "border-green-400/20" : "border-white/6"}`}>
                    <div className="mb-4 flex items-center gap-3">
                      {p.jerseyNumber && (
                        <span className="text-2xl font-black text-green-400">#{p.jerseyNumber}</span>
                      )}
                      <div>
                        <div className="font-black text-base">{p.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{p.school} · {p.position || "포지션 미정"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => vote(p.id, "MVP")}
                        disabled={submitting || (!!mvpVote && !isMyMvp)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${
                          isMyMvp
                            ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-300"
                            : mvpVote
                              ? "opacity-25 border-white/6 text-gray-700 cursor-not-allowed"
                              : "bg-white/[0.02] border-white/8 text-gray-500 hover:border-yellow-400/30 hover:text-yellow-400"
                        }`}
                      >
                        ⭐ MVP {isMyMvp ? "✓" : ""}
                      </button>
                      <button
                        onClick={() => vote(p.id, "FAIRPLAY")}
                        disabled={submitting || isMyMvp || (!!fairplayVote && !isMyFairplay)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${
                          isMyFairplay
                            ? "bg-blue-400/15 border-blue-400/40 text-blue-300"
                            : isMyMvp || (!!fairplayVote && !isMyFairplay)
                              ? "opacity-25 border-white/6 text-gray-700 cursor-not-allowed"
                              : "bg-white/[0.02] border-white/8 text-gray-500 hover:border-blue-400/30 hover:text-blue-400"
                        }`}
                      >
                        🤝 페어플레이 {isMyFairplay ? "✓" : ""}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
