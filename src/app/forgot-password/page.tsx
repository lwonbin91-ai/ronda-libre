"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else { const d = await res.json(); setError(d.error || "오류 발생"); }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-green-400 font-black text-lg">Ronda <span className="text-white">Libre</span></p>
          <h1 className="text-2xl font-black mt-3">비밀번호 찾기</h1>
          <p className="text-gray-500 text-sm mt-2">가입한 이메일을 입력하면 재설정 링크를 보내드립니다.</p>
        </div>

        {done ? (
          <div className="bg-green-400/10 border border-green-400/25 rounded-2xl p-6 text-center">
            <p className="text-green-400 font-bold text-lg mb-2">메일을 확인해주세요 ✉️</p>
            <p className="text-gray-400 text-sm">입력하신 이메일로 재설정 링크를 발송했습니다.<br />1시간 내에 링크를 클릭해 주세요.</p>
            <Link href="/login" className="block mt-6 text-xs text-gray-600 hover:text-white transition-colors">로그인으로 돌아가기</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-8 space-y-4">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">이메일</label>
              <input
                required type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400"
                placeholder="example@email.com"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50"
            >
              {loading ? "발송 중..." : "재설정 링크 받기"}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-xs text-gray-600 hover:text-white transition-colors">로그인으로 돌아가기</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
