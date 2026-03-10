"use client";

import { useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  author: { name: string };
}

export default function AnnouncementList({ list }: { list: Announcement[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {list.map((a) => (
        <button
          key={a.id}
          onClick={() => setSelected(selected === a.id ? null : a.id)}
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
            <span className="text-gray-600 text-sm shrink-0">{selected === a.id ? "▲" : "▼"}</span>
          </div>
          {selected === a.id && (
            <div className="mt-4 pt-4 border-t border-white/8 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {a.content}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
