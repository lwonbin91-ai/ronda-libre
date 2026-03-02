"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: { name: string };
}

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch("/api/announcements").then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : []));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">NOTICE</p>
          <h1 className="text-4xl font-black">공지사항</h1>
          <p className="text-gray-500 text-sm mt-2">리그 운영 안내 및 주요 공지를 확인하세요.</p>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-20 text-gray-600">등록된 공지사항이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {list.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(selected?.id === a.id ? null : a)}
                className="w-full text-left bg-[#0d0d0d] border border-white/6 rounded-2xl p-5 hover:border-green-400/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  {a.isPinned && (
                    <span className="text-[10px] font-black text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                      공지
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{a.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(a.createdAt).toLocaleDateString("ko-KR")} · {a.author.name}
                    </p>
                  </div>
                  <span className="text-gray-600 text-sm shrink-0">{selected?.id === a.id ? "▲" : "▼"}</span>
                </div>
                {selected?.id === a.id && (
                  <div className="mt-4 pt-4 border-t border-white/8 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {a.content}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-gray-600 hover:text-white border border-white/8 px-4 py-2 rounded-lg transition-colors">
            ← 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
