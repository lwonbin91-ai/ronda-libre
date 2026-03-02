"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/login?reset=1");
    else { const d = await res.json(); setError(d.error || "오류 발생"); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0d0d0d] border border-white/8 rounded-2xl p-8 space-y-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {["새 비밀번호", "비밀번호 확인"].map((label, i) => (
        <div key={label}>
          <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
          <input
            required type="password" minLength={6}
            value={i === 0 ? password : confirm}
            onChange={(e) => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400"
            placeholder={i === 0 ? "6자 이상" : "다시 입력"}
          />
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50">
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
      <div className="text-center">
        <Link href="/login" className="text-xs text-gray-600 hover:text-white transition-colors">로그인으로 돌아가기</Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-green-400 font-black text-lg">Ronda <span className="text-white">Libre</span></p>
          <h1 className="text-2xl font-black mt-3">새 비밀번호 설정</h1>
        </div>
        <Suspense fallback={<div className="text-gray-500 text-center">로딩 중...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
