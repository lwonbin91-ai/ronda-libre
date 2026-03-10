"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface Offer {
  id: string;
  clubName: string;
  message: string;
  status: string;
  createdAt: string;
  player: { id: string; name: string; school: string; position: string | null; birthYear: number };
}

export default function ScoutDashboard({
  userName, role, offers,
}: {
  userName: string;
  role: string;
  offers: Offer[];
}) {
  const [offerForm, setOfferForm] = useState({ playerId: "", clubName: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendOffer = async () => {
    if (!offerForm.playerId || !offerForm.clubName || !offerForm.message) {
      setError("모든 항목을 입력해주세요."); return;
    }
    setSending(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offerForm),
    });
    setSending(false);
    if (res.ok) { setSent(true); setOfferForm({ playerId: "", clubName: "", message: "" }); setError(""); }
    else { const d = await res.json(); setError(d.error || "오류 발생"); }
  };

  const statusLabel: Record<string, string> = { PENDING: "대기 중", ACCEPTED: "수락됨", DECLINED: "거절됨" };
  const statusColor: Record<string, string> = {
    PENDING: "text-yellow-400 border-yellow-400/25 bg-yellow-400/5",
    ACCEPTED: "text-green-400 border-green-400/25 bg-green-400/5",
    DECLINED: "text-red-400 border-red-400/25 bg-red-400/5",
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black">{userName}님의 대시보드</h1>
          <p className="text-gray-500 mt-1">
            {role === "DIRECTOR" ? "감독" : "스카우터"} 계정 · 선수 정보 조회 및 입단 제의
          </p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-gray-600 hover:text-white border border-white/8 px-4 py-2 rounded-lg transition-colors">
          로그아웃
        </button>
      </div>

      {/* 메뉴 */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <Link href="/players"
          className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 hover:border-green-400/20 transition-all group text-center">
          <div className="text-2xl mb-2">👤</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">선수 보기</div>
          <div className="text-xs text-gray-600 mt-0.5">등록 선수 프로필 조회</div>
        </Link>
        <Link href="/videos"
          className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 hover:border-green-400/20 transition-all group text-center">
          <div className="text-2xl mb-2">🎬</div>
          <div className="font-bold text-sm group-hover:text-green-400 transition-colors">경기 영상</div>
          <div className="text-xs text-gray-600 mt-0.5">경기 영상 확인</div>
        </Link>
        <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-5 text-center">
          <div className="text-2xl mb-2">📨</div>
          <div className="font-bold text-sm">입단 제의</div>
          <div className="text-xs text-gray-600 mt-0.5">총 {offers.length}건</div>
        </div>
      </div>

      {/* 입단 제의 보내기 */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6 mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">입단 제의하기</p>
        {sent && (
          <div className="mb-4 p-3 bg-green-400/10 border border-green-400/20 rounded-xl text-xs text-green-400 font-bold">
            입단 제의가 전송되었습니다.
            <button onClick={() => setSent(false)} className="ml-2 text-gray-500 hover:text-white">닫기</button>
          </div>
        )}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">선수 ID</label>
            <input value={offerForm.playerId} onChange={(e) => setOfferForm({ ...offerForm, playerId: e.target.value })}
              placeholder="선수 프로필 페이지에서 URL의 ID를 입력하세요"
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400" />
            <p className="text-xs text-gray-700 mt-1">선수 프로필 페이지에서 URL: /players/[선수ID]</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">구단 / 학교명</label>
            <input value={offerForm.clubName} onChange={(e) => setOfferForm({ ...offerForm, clubName: e.target.value })}
              placeholder="FC 예시"
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">제의 메시지</label>
            <textarea value={offerForm.message} onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
              rows={3} placeholder="선수에게 보낼 메시지를 입력하세요"
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400 resize-none" />
          </div>
          <button onClick={sendOffer} disabled={sending}
            className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50">
            {sending ? "전송 중..." : "입단 제의 보내기"}
          </button>
        </div>
      </div>

      {/* 제안한 입단 요청 목록 */}
      <div className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">제안한 입단 요청</p>
        {offers.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-6">아직 제의한 선수가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <div key={o.id} className="flex items-start justify-between gap-4 p-4 bg-black/40 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/players/${o.player.id}`} className="font-bold text-sm hover:text-green-400 transition-colors">
                      {o.player.name}
                    </Link>
                    <span className="text-xs text-gray-600">{o.player.school} · {o.player.position || "-"}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-bold">{o.clubName}</p>
                  <p className="text-xs text-gray-600 mt-1 truncate">{o.message}</p>
                  <p className="text-[10px] text-gray-700 mt-1">{new Date(o.createdAt).toLocaleDateString("ko-KR")}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColor[o.status]}`}>
                  {statusLabel[o.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
