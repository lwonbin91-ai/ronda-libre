import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getVideoEmbed } from "@/lib/video";
export const dynamic = "force-dynamic";




const LEVEL_LABEL: Record<string, string> = {
  ALL: "", U1: "1년 미만", U3: "3년 미만", U5: "5년 미만", U6P: "6년 이상",
};

export default async function VideosPage() {
  const videos = await prisma.matchSchedule.findMany({
    where: { videoUrl: { not: null } },
    select: {
      id: true, title: true, videoUrl: true, videoTitle: true,
      scheduledAt: true, location: true, type: true, level: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="mb-12">
        <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">경기 영상</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">모든 경기를 기록합니다</h1>
        <p className="text-gray-600 text-base">Ronda Libre의 경기 영상을 확인하세요.</p>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-24 text-gray-700">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm">아직 공개된 영상이 없습니다.</p>
          <p className="text-xs text-gray-800 mt-1">경기 후 관리자가 영상을 등록하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const embed = getVideoEmbed(v.videoUrl!);
            const isYoutube = embed?.type === "youtube";
            const date = new Date(v.scheduledAt);
            return (
              <div key={v.id} className="bg-[#0d0d0d] border border-white/6 rounded-2xl overflow-hidden hover:border-white/12 transition-all">
                <div className="aspect-video bg-black relative">
                  {isYoutube ? (
                    <iframe
                      src={embed!.src}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <a
                      href={v.videoUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-900 to-black group/btn"
                    >
                      <div className="w-16 h-16 bg-green-400/10 border border-green-400/25 rounded-2xl flex items-center justify-center group-hover/btn:bg-green-400/20 group-hover/btn:scale-110 transition-all">
                        <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">클릭하여 영상 보기</p>
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1 justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          새 탭에서 열립니다
                        </p>
                      </div>
                    </a>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        v.type === "SEASON"
                          ? "border-green-400/20 text-green-400/70 bg-green-400/5"
                          : "border-white/10 text-gray-500"
                      }`}>
                        {v.type === "SEASON" ? "시즌 리그" : "오픈 매칭"}
                      </span>
                      {v.level && v.level !== "ALL" && (
                        <span className="text-[10px] border border-blue-400/20 text-blue-400/70 px-2 py-0.5 rounded-full">
                          {LEVEL_LABEL[v.level]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 shrink-0">
                      {date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="font-black text-sm leading-tight">{v.title}</p>
                  {v.videoTitle && <p className="text-xs text-gray-500 mt-1">{v.videoTitle}</p>}
                  {v.location && <p className="text-xs text-gray-600 mt-0.5">{v.location}</p>}
                  <Link href={`/matches/${v.id}`} className="mt-3 inline-block text-xs text-green-400 hover:underline">
                    경기 상세 보기 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
