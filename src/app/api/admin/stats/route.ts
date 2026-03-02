import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  try {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getMonth() + 1}월` };
    });

    const [totalPlayers, totalSchedules, confirmedRegs] = await Promise.all([
      prisma.player.count(),
      prisma.matchSchedule.count(),
      prisma.scheduleRegistration.findMany({
        where: { status: "CONFIRMED" },
        select: { fee: true, createdAt: true },
      }),
    ]);

    const monthlyStats = months.map(({ year, month, label }) => {
      const regs = confirmedRegs.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      return {
        label,
        revenue: regs.reduce((acc, r) => acc + r.fee, 0),
        registrations: regs.length,
      };
    });

    const recentSchedules = await prisma.matchSchedule.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, scheduledAt: true, status: true, _count: { select: { registrations: true } } },
    });

    return NextResponse.json({
      totalPlayers,
      totalSchedules,
      totalRevenue: confirmedRegs.reduce((acc, r) => acc + r.fee, 0),
      monthlyStats,
      recentSchedules,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
