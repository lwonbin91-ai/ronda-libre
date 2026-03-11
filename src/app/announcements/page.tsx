import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AnnouncementList from "./AnnouncementList";

export const revalidate = 30;

export default async function AnnouncementsPage() {
  const list = await prisma.announcement.findMany({
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

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
          <AnnouncementList list={list} />
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
