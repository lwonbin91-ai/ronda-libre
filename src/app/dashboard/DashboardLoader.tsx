"use client";

import { useEffect, useState } from "react";
import DashboardClient from "./DashboardClient";
import ScoutDashboard from "./ScoutDashboard";

interface DashboardLoaderProps {
  userName: string;
  role: string;
}

export default function DashboardLoader({ userName, role }: DashboardLoaderProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/data", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ error: true }));
  }, []);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black">{userName}님의 대시보드</h1>
            <p className="text-gray-500 mt-1">나의 경기 기록과 리그 활동을 확인하세요.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-4 sm:p-6 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[0, 1].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-4 animate-pulse h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 text-center text-gray-500">
        데이터를 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
      </div>
    );
  }

  if (role === "SCOUT" || role === "DIRECTOR") {
    return <ScoutDashboard userName={userName} role={role} offers={data.offers ?? []} />;
  }

  return (
    <DashboardClient
      userName={userName}
      players={data.players ?? []}
      initialPendingVotes={data.pendingVotes ?? []}
    />
  );
}
