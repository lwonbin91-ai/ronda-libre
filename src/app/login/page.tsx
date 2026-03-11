"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            <span className="text-green-400">Ronda</span> 로그인
          </h1>
          <p className="text-gray-500 text-sm">계정이 없으신가요?{" "}
            <Link href="/signup" className="text-green-400 hover:underline">회원가입</Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">이메일</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">비밀번호</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-400 transition-colors"
              placeholder="비밀번호"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 text-black font-black py-3 rounded-xl hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
          <div className="text-center pt-1">
            <Link href="/forgot-password" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">비밀번호를 잊으셨나요?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
