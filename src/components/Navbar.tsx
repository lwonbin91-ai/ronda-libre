"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string; name?: string } | undefined;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-black/80 backdrop-blur-md border-b border-white/5 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="text-xl font-black tracking-tight shrink-0">
        <span className="text-green-400">Ronda</span>{" "}
        <span className="text-white">Libre</span>
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="/announcements" className="text-gray-400 hover:text-white transition-colors">공지사항</Link>
        <Link href="/matches" className="text-gray-400 hover:text-white transition-colors">경기 신청</Link>
        <Link href="/videos" className="text-gray-400 hover:text-white transition-colors">경기 영상</Link>
        <Link href="/players" className="text-gray-400 hover:text-white transition-colors">선수 보기</Link>
        <Link href="/standings" className="text-gray-400 hover:text-white transition-colors">순위표</Link>
        {session ? (
          <>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">대시보드</Link>
            {user?.role === "SCOUT" && (
              <Link href="/scout" className="text-gray-400 hover:text-white transition-colors">스카우트</Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">관리자</Link>
            )}
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <span className="text-green-400 font-bold text-xs">{user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">로그인</Link>
            <Link
              href="/signup"
              className="bg-green-400 text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-green-300 transition-all hover:scale-105"
            >
              시작하기
            </Link>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-gray-400 hover:text-white"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="메뉴"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-b border-white/10 px-6 py-4 flex flex-col gap-4 text-sm font-medium md:hidden">
          <Link href="/announcements" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">공지사항</Link>
          <Link href="/matches" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">경기 신청</Link>
          <Link href="/videos" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">경기 영상</Link>
          <Link href="/players" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">선수 보기</Link>
          <Link href="/standings" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">순위표</Link>
          {session ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">대시보드</Link>
              {user?.role === "SCOUT" && (
                <Link href="/scout" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">스카우트</Link>
              )}
              {user?.role === "ADMIN" && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">관리자</Link>
              )}
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-gray-500 hover:text-white">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">로그인</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="bg-green-400 text-black px-5 py-2 rounded-full font-bold text-center hover:bg-green-300 transition-colors">시작하기</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
