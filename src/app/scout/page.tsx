"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Offer {
  id: string;
  status: string;
  clubName: string;
  message: string;
  createdAt: string;
  player: { name: string; school: string; birthYear: number };
  scout: { name: string; organization: string | null };
}

interface Player {
  id: string;
  name: string;
  birthYear: number;
  school: string;
  position: string | null;
  matchRecords: Array<{ goals: number; assists: number }>;
}

export default function ScoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  const [players, setPlayers] = useState<Player[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && user?.role !== "SCOUT" && user?.role !== "DIRECTOR" && user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/players?public=true").then((r) => r.json()),
        fetch("/api/offers").then((r) => r.json()),
      ]).then(([p, o]) => {
        setPlayers(p);
        setOffers(o);
        setLoading(false);
      });
    }
  }, [status, user, router]);

  const filtered = players.filter(
    (p) => p.name.includes(search) || p.school.includes(search) || (p.position || "").includes(search)
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>;
  }

  const sentOffers = offers.filter((o) => o.status === "PENDING").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black mb-2">스카우트 대시보드</h1>
        <p className="text-gray-500">Ronda Libre 선수들을 발굴하세요.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "전체 선수", value: players.length },
          { label: "발송한 제의", value: offers.length },
          { label: "대기 중 제의", value: sentOffers },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-green-400">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 내가 보낸 제의 */}
      {offers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-black mb-4">발송한 입단 제의</h2>
          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold">{offer.player.name}</span>
                  <span className="text-gray-500 text-sm ml-2">{offer.player.school}</span>
                  <p className="text-sm text-gray-600 mt-0.5">{offer.clubName}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  offer.status === "ACCEPTED"
                    ? "border-green-400/30 text-green-400 bg-green-400/10"
                    : offer.status === "DECLINED"
                    ? "border-red-400/30 text-red-400 bg-red-400/10"
                    : "border-yellow-400/30 text-yellow-400 bg-yellow-400/10"
                }`}>
                  {offer.status === "ACCEPTED" ? "수락됨" : offer.status === "DECLINED" ? "거절됨" : "대기 중"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선수 목록 */}
      <div>
        <h2 className="text-xl font-black mb-4">선수 목록</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 학교, 포지션 검색..."
          className="w-full bg-gray-900 border border-white/10 rounded-xl px-5 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors mb-4"
        />
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((player) => {
            const goals = player.matchRecords.reduce((s, r) => s + r.goals, 0);
            const assists = player.matchRecords.reduce((s, r) => s + r.assists, 0);
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="bg-gray-900 border border-white/5 rounded-2xl p-5 hover:border-green-400/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black group-hover:text-green-400 transition-colors">{player.name}</h3>
                    <p className="text-gray-500 text-sm">{player.school} · {player.birthYear}년생</p>
                  </div>
                  {player.position && (
                    <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded-full font-bold">
                      {player.position}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "경기", value: player.matchRecords.length },
                    { label: "골", value: goals },
                    { label: "도움", value: assists },
                  ].map((s) => (
                    <div key={s.label} className="bg-black rounded-lg p-2">
                      <div className="font-black">{s.value}</div>
                      <div className="text-xs text-gray-600">{s.label}</div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
