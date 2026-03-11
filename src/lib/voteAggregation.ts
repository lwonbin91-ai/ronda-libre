import { prisma } from "@/lib/prisma";

const VOTE_DEADLINE_HOURS = 24;

async function aggregateTeam(
  scheduleId: string,
  teamRegs: { id: string; playerId: string }[]
) {
  const playerIds = teamRegs.map((r) => r.playerId);

  const [mvpVotes, fairplayVotes] = await Promise.all([
    prisma.playerVote.groupBy({
      by: ["targetId"],
      where: { scheduleId, targetId: { in: playerIds }, voteType: "MVP" },
      _count: { targetId: true },
      orderBy: { _count: { targetId: "desc" } },
    }),
    prisma.playerVote.groupBy({
      by: ["targetId"],
      where: { scheduleId, targetId: { in: playerIds }, voteType: "FAIRPLAY" },
      _count: { targetId: true },
      orderBy: { _count: { targetId: "desc" } },
    }),
  ]);

  const topMvpCount = mvpVotes[0]?._count.targetId ?? 0;
  const topFpCount = fairplayVotes[0]?._count.targetId ?? 0;

  const topMvpIds = topMvpCount > 0
    ? mvpVotes.filter((v) => v._count.targetId === topMvpCount).map((v) => v.targetId)
    : [];
  const topFpIds = topFpCount > 0
    ? fairplayVotes.filter((v) => v._count.targetId === topFpCount).map((v) => v.targetId)
    : [];

  await prisma.scheduleRegistration.updateMany({
    where: { id: { in: teamRegs.map((r) => r.id) } },
    data: { isMVP: false, isFairplay: false },
  });

  for (const playerId of topMvpIds) {
    const reg = teamRegs.find((r) => r.playerId === playerId);
    if (reg) await prisma.scheduleRegistration.update({ where: { id: reg.id }, data: { isMVP: true } });
  }
  for (const playerId of topFpIds) {
    const reg = teamRegs.find((r) => r.playerId === playerId);
    if (reg) await prisma.scheduleRegistration.update({ where: { id: reg.id }, data: { isFairplay: true } });
  }
}

/**
 * 팀 단위로 집계 조건 확인 후 집계 실행.
 * - 팀원 전원 투표 완료 → 즉시 집계
 * - 24시간 경과 → 미투표 무시하고 집계
 * - 아직 투표 중 → 플래그 초기화(반영 안 함)
 */
export async function tryAggregateVotes(scheduleId: string): Promise<void> {
  const schedule = await prisma.matchSchedule.findUnique({
    where: { id: scheduleId },
    select: { endedAt: true },
  });
  if (!schedule) return;

  const deadline = schedule.endedAt
    ? new Date(schedule.endedAt.getTime() + VOTE_DEADLINE_HOURS * 60 * 60 * 1000)
    : null;
  const deadlinePassed = deadline ? new Date() >= deadline : false;

  const allRegs = await prisma.scheduleRegistration.findMany({
    where: { scheduleId, status: { not: "CANCELLED" } },
    select: { id: true, playerId: true, teamLabel: true },
  });

  const teamMap: Record<string, typeof allRegs> = {};
  for (const r of allRegs) {
    const key = r.teamLabel || "none";
    if (!teamMap[key]) teamMap[key] = [];
    teamMap[key].push(r);
  }

  for (const teamRegs of Object.values(teamMap)) {
    const playerIds = teamRegs.map((r) => r.playerId);

    if (!deadlinePassed) {
      const votes = await prisma.playerVote.findMany({
        where: { scheduleId, voterId: { in: playerIds } },
        select: { voterId: true, voteType: true },
      });

      const allVoted = playerIds.every((pid) => {
        const pv = votes.filter((v) => v.voterId === pid);
        return pv.some((v) => v.voteType === "MVP") && pv.some((v) => v.voteType === "FAIRPLAY");
      });

      if (!allVoted) {
        // 투표 진행 중 → 결과 미반영
        await prisma.scheduleRegistration.updateMany({
          where: { id: { in: teamRegs.map((r) => r.id) } },
          data: { isMVP: false, isFairplay: false },
        });
        continue;
      }
    }

    await aggregateTeam(scheduleId, teamRegs);
  }
}

/**
 * 24시간이 지난 ENDED 경기 중 아직 미집계된 것을 일괄 처리.
 * 순위표/프로필 로드 시 호출.
 */
export async function finalizeExpiredMatches(): Promise<void> {
  const cutoff = new Date(Date.now() - VOTE_DEADLINE_HOURS * 60 * 60 * 1000);

  const pendingSchedules = await prisma.matchSchedule.findMany({
    where: {
      status: "ENDED",
      endedAt: { lte: cutoff },
      registrations: { some: { isMVP: false, isFairplay: false, status: { not: "CANCELLED" } } },
    },
    select: { id: true },
    take: 20,
  });

  await Promise.all(pendingSchedules.map((s) => tryAggregateVotes(s.id)));
}
