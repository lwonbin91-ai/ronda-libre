import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col overflow-hidden bg-[#030303]">

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 100% 70% at 50% -10%, #071c0f 0%, #030303 60%)" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-b from-transparent to-[#030303]" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full border border-green-400/20 bg-green-400/5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-[11px] font-bold tracking-[0.2em] uppercase">유소년 풋살 · 축구 경기 리그</span>
          </div>

          <h1 className="font-black leading-[0.9] tracking-[-0.045em] mb-4"
            style={{ fontSize: "clamp(2.6rem, 9vw, 7.5rem)" }}>
            <span className="block text-white">아이들이</span>
            <span className="block text-white">스스로 뛰는</span>
            <span className="block"
              style={{ background: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              리그.
            </span>
          </h1>

          <div className="mb-7 text-center">
            <p className="text-white font-black text-lg sm:text-xl tracking-tight"><span className="text-green-400">Ronda</span> Libre</p>
            <p className="text-white text-sm mt-0.5">유소년을 위한 자유로운 경기 문화</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href="/matches"
              className="group relative bg-green-400 text-black px-8 py-4 rounded-full font-black text-sm tracking-wide hover:bg-green-300 transition-all active:scale-[.97] overflow-hidden"
              style={{ boxShadow: "0 0 50px -8px rgba(74,222,128,0.55)" }}>
              <span className="relative z-10">경기 신청하기 →</span>
            </Link>
            <Link href="/videos"
              className="border border-white/10 text-gray-400 px-8 py-4 rounded-full font-semibold text-sm hover:border-white/25 hover:text-white transition-all active:scale-[.97]">
              경기 영상 보기
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mb-16 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              코치가 아닌 <span className="text-white font-semibold">아이가 결정하는</span> 리그.
            </p>
            <span className="hidden sm:block text-gray-700">·</span>
            <p className="text-gray-500 text-sm leading-relaxed">
              시즌 동안 최소 <span className="text-green-400 font-semibold">16경기</span> 보장.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden max-w-sm mx-auto w-full">
            {[
              { num: "16+", label: "경기 보장" },
              { num: "100%", label: "균등 출전" },
              { num: "0원", label: "GK 참가비" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0a0a0a] py-5 text-center">
                <div className="text-xl sm:text-2xl font-black text-white">{s.num}</div>
                <div className="text-[10px] text-gray-600 mt-1 tracking-widest uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ DIFFERENCE ══════ */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase mb-3">WHY RONDA</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]">무엇이 다른가</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/5 bg-[#080808] p-8 sm:p-10">
              <p className="text-[10px] text-red-400/60 font-bold tracking-[0.25em] uppercase mb-6">기존 한국 리그</p>
              <ul className="space-y-4">
                {["코치가 전술을 지시한다", "부모가 사이드라인에서 소리친다", "리그 10~12경기로 시즌이 끝난다", "시작이 늦은 아이는 벤치에서 대기하는 시간이 길다"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-2 w-3 h-px bg-red-500/30 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-green-400/15 p-8 sm:p-10 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #061a0e 0%, #030303 70%)" }}>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-400/6 rounded-full blur-3xl" />
              <p className="text-[10px] text-green-400/70 font-bold tracking-[0.25em] uppercase mb-6 relative z-10">Ronda Libre</p>
              <ul className="space-y-4 relative z-10">
                {["아이가 직접 전술을 결정한다", "부모 개입 금지 구역", "매주 1~2경기, 최소 16경기 보장", "모든 선수가 동등한 출전 시간"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="mt-2 w-3 h-px bg-green-400/50 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ PHILOSOPHY ══════ */}
      <section className="px-6 py-20 sm:py-28 border-t border-white/4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase mb-10">OUR PHILOSOPHY</p>
          <div className="space-y-6 mb-12">
            <div className="w-8 h-px bg-green-400/40 mx-auto" />
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              이곳에서 선수는<br />
              <span className="text-white font-bold">따르는 선수</span>가 아니라<br />
              <span className="text-green-400 font-bold">결정하는 선수</span>가 됩니다.
            </p>
          </div>
          <div className="inline-block border border-green-400/25 rounded-2xl px-8 py-5 bg-green-400/5">
            <p className="text-green-400 font-black text-lg tracking-tight">Más Partido. Más Decisión.</p>
            <p className="text-gray-500 text-sm mt-1">더 많은 경기, 더 많은 선택.</p>
          </div>
        </div>
      </section>

      {/* ══════ PROGRAMS ══════ */}
      <section className="px-6 py-20 sm:py-28 border-t border-white/4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase mb-3">PROGRAM</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]">두 가지 방식으로 참여</h2>
            </div>
            <Link href="/matches" className="text-sm text-gray-600 hover:text-green-400 transition-colors font-medium self-start">
              전체 경기 보기 →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="relative rounded-3xl border border-green-400/20 p-8 sm:p-10 overflow-hidden"
              style={{ background: "linear-gradient(145deg, #071d0f 0%, #050505 60%)" }}>
              <div className="absolute top-0 right-0 w-56 h-56 bg-green-400/5 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] font-bold text-green-400/80 tracking-[0.2em] uppercase border border-green-400/20 px-3 py-1 rounded-full">시즌형</span>
                  <span className="text-[10px] font-bold text-black bg-green-400 px-2.5 py-1 rounded-full">인기</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-3">시즌 리그</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-7">임의 편성된 팀에 개인 신청.<br />6–8주 동안 매주 1~2회 리그(리그당 25분씩 3-4경기).<br />아이들이 직접 팀을 운영합니다.</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {["최소 16경기 보장", "개인 기록 & 영상", "스카우터 공개 프로필", "GK 무료 참가"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-white/6">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black">89,000</span>
                    <span className="text-gray-600 text-sm">원 / 월</span>
                  </div>
                  <Link href="/matches" className="block w-full bg-green-400 text-black text-center py-3 rounded-xl font-black text-sm hover:bg-green-300 transition-colors">
                    시즌 신청하기
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl border border-white/7 bg-[#080808] p-8 sm:p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase border border-white/8 px-3 py-1 rounded-full">1회성</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-3">오픈 매칭</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-7">이번주 경기가 부족했다면.<br />개인 신청 후 자동 팀 배정.<br />2시간 25분씩 3–4경기.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {["당일 신청 가능", "자동 팀 배정", "경기 기록 & 영상", "GK 무료 참가"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-gray-500">
                    <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">25,000</span>
                  <span className="text-gray-600 text-sm">원 / 1회</span>
                </div>
                <Link href="/matches" className="block w-full bg-white/6 text-white text-center py-3 rounded-xl font-black text-sm hover:bg-white/12 transition-colors border border-white/8">
                  매칭 신청하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ GK FREE ══════ */}
      <section className="px-6 py-16 border-t border-white/4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-green-400/15 p-8 sm:p-12 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #061a0e 0%, #050505 70%)" }}>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-400/6 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
              <div className="text-5xl">🧤</div>
              <div className="flex-1">
                <p className="text-[10px] text-green-400/70 font-bold tracking-[0.25em] uppercase mb-2">GOALKEEPER</p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">GK는 무료입니다</h3>
                <p className="text-gray-500 text-sm leading-relaxed">골키퍼 포지션은 참가비 없이 무료 참가 가능합니다. 팀당 1명 제한. 선수 프로필에서 포지션을 GK로 등록하세요.</p>
              </div>
              <Link href="/signup" className="shrink-0 bg-green-400 text-black px-6 py-3 rounded-full font-black text-sm hover:bg-green-300 transition-colors whitespace-nowrap">
                GK 등록하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SCOUT ══════ */}
      <section className="px-6 py-20 sm:py-28 border-t border-white/4">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <p className="text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase mb-4">SCOUT & DISCOVER</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-tight mb-5">
                선수를<br />직접 발굴하세요
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                모든 경기 영상이 플랫폼에 기록됩니다.
                선수별 기록과 영상을 확인하고
                마음에 드는 선수에게 입단 제의를 직접 보낼 수 있습니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup?role=SCOUT"
                  className="inline-flex items-center gap-2 border border-white/12 text-white px-6 py-3 rounded-full font-bold text-sm hover:border-green-400/40 hover:text-green-400 transition-all active:scale-[.97]">
                  스카우터로 가입
                </Link>
                <Link href="/players"
                  className="inline-flex items-center gap-2 text-gray-600 px-6 py-3 rounded-full font-bold text-sm hover:text-gray-400 transition-colors">
                  선수 목록 보기 →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "▶", title: "경기 영상", desc: "모든 경기 풀영상 열람" },
                { icon: "📊", title: "개인 기록", desc: "골·어시스트·출전 시간" },
                { icon: "✉", title: "입단 제의", desc: "선수에게 직접 발송" },
                { icon: "📱", title: "보호자 연락", desc: "연락처 & 이메일 확인" },
              ].map((f) => (
                <div key={f.title} className="bg-white/[0.02] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-colors">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <p className="font-bold text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ HOW IT WORKS ══════ */}
      <section className="px-6 py-20 sm:py-28 border-t border-white/4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] text-gray-700 font-bold tracking-[0.3em] uppercase mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]">참여 방법</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "01", title: "회원가입", desc: "선수 계정으로 5분 만에 가입" },
              { step: "02", title: "프로필 등록", desc: "선수 정보와 포지션 등록" },
              { step: "03", title: "경기 신청", desc: "원하는 경기 일정 선택 & 신청" },
              { step: "04", title: "경기 참가", desc: "당일 참가 후 기록 자동 저장" },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && <div className="hidden sm:block absolute top-5 right-0 w-full h-px bg-white/5 translate-x-1/2" />}
                <div className="bg-[#080808] border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-colors">
                  <div className="text-[10px] font-black text-green-400/50 tracking-widest mb-4">{s.step}</div>
                  <h4 className="font-bold text-base mb-2">{s.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="px-6 py-20 sm:py-24 border-t border-white/4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-green-400/20 bg-green-400/5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-green-400 text-[11px] font-bold tracking-[0.2em] uppercase">지금 모집 중</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] mb-5">
            지금 바로<br />시작하세요
          </h2>
          <p className="text-gray-500 text-base mb-10 leading-relaxed">선수 등록부터 경기 신청까지 5분이면 됩니다.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="bg-green-400 text-black px-10 py-4 rounded-full font-black text-sm hover:bg-green-300 transition-all active:scale-[.97]"
              style={{ boxShadow: "0 0 50px -10px rgba(74,222,128,0.5)" }}>
              선수 등록하기
            </Link>
            <Link href="/matches"
              className="border border-white/10 text-gray-400 px-10 py-4 rounded-full font-semibold text-sm hover:border-white/25 hover:text-white transition-all">
              경기 일정 확인
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-black text-lg tracking-tight">
              <span className="text-green-400">Ronda</span> Libre
            </p>
            <p className="text-gray-700 text-xs mt-1">유소년 풋살 · 축구 경기 리그</p>
          </div>
          <nav className="flex items-center gap-6 text-xs text-gray-700 flex-wrap justify-center">
            <Link href="/matches" className="hover:text-gray-400 transition-colors">경기 신청</Link>
            <Link href="/videos" className="hover:text-gray-400 transition-colors">경기 영상</Link>
            <Link href="/players" className="hover:text-gray-400 transition-colors">선수 프로필</Link>
            <Link href="/signup?role=SCOUT" className="hover:text-gray-400 transition-colors">스카우터</Link>
            <Link href="/admin" className="hover:text-gray-400 transition-colors">관리자</Link>
          </nav>
          <p className="text-gray-800 text-xs">© 2026 Ronda Libre</p>
        </div>
      </footer>
    </div>
  );
}
