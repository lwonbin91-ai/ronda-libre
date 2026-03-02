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
  const [participants, setParticipants] = useState<Participant[]>([]);
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
          setParticipants(data.participants);
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
        const filtered = prev.filter((v) => v.voteType !== voteType);
        return [...filtered, data];
      });
    } else {
      setError(data.error || "오류 발생");
    }
  };

  const mvpVote = myVotes.find((v) => v.voteType === "MVP");
  const fairplayVote = myVotes.find((v) => v.voteType === "FAIRPLAY");

  const others = participants.filter((p) => p.id !== myPlayerId);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>;

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xs text-gray-600 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition-colors">
          ← 대시보드
        </Link>
        <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mt-5 mb-2">VOTE</p>
        <h1 className="text-3xl font-black">경기 투표</h1>
        <p className="text-gray-500 text-sm mt-1">이번 경기에서 MVP와 페어플레이 선수를 선택해주세요. (각 1명, 자기 자신 제외)</p>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm rounded-xl p-4 mb-6">{error}</div>
      )}

      {others.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">투표할 수 있는 다른 참가자가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {others.map((p) => {
            const isMyMvp = mvpVote?.targetId === p.id;
            const isMyFairplay = fairplayVote?.targetId === p.id;
            return (
              <div key={p.id} className="bg-[#0d0d0d] border border-white/6 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-black text-base">{p.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{p.school} · {p.position || "포지션 미정"}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => vote(p.id, "MVP")}
                    disabled={submitting}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors disabled:opacity-50 ${
                      isMyMvp
                        ? "bg-yellow-400/15 border-yellow-400/40 text-yellow-300"
                        : "bg-white/[0.02] border-white/8 text-gray-500 hover:border-yellow-400/30 hover:text-yellow-400"
                    }`}
                  >
                    ⭐ MVP {isMyMvp ? "✓ 선택됨" : ""}
                  </button>
                  <button
                    onClick={() => vote(p.id, "FAIRPLAY")}
                    disabled={submitting}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors disabled:opacity-50 ${
                      isMyFairplay
                        ? "bg-blue-400/15 border-blue-400/40 text-blue-300"
                        : "bg-white/[0.02] border-white/8 text-gray-500 hover:border-blue-400/30 hover:text-blue-400"
                    }`}
                  >
                    🤝 페어플레이 {isMyFairplay ? "✓ 선택됨" : ""}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(mvpVote || fairplayVote) && (
        <div className="mt-6 bg-green-400/5 border border-green-400/15 rounded-xl p-4 text-sm">
          <p className="text-green-400 font-bold mb-2">내 투표 현황</p>
          {mvpVote && (
            <p className="text-gray-400">⭐ MVP: {participants.find((p) => p.id === mvpVote.targetId)?.name}</p>
          )}
          {fairplayVote && (
            <p className="text-gray-400">🤝 페어플레이: {participants.find((p) => p.id === fairplayVote.targetId)?.name}</p>
          )}
        </div>
      )}
    </div>
  );
}
