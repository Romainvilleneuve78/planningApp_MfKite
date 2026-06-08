"use client";

import { UserRole } from "@/types";

// ── Aide Mono : objectif 35h ──────────────────────────────
interface AideMonoProps {
  totalHours: number;
  targetHours?: number;
}

function AideMonoSummary({ totalHours, targetHours = 35 }: AideMonoProps) {
  const diff = totalHours - targetHours;
  const isOver = diff >= 0;
  const diffText =
    diff === 0
      ? "Objectif atteint"
      : `${isOver ? "+" : ""}${diff.toFixed(1).replace(".0", "")}h`;
  const pct = Math.min(100, Math.round((totalHours / targetHours) * 100));

  return (
    <div className="border-t border-gray-100 bg-white/60 backdrop-blur-sm px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Total semaine</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalHours.toFixed(1).replace(".0", "")}h
            </p>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Objectif</p>
            <p className="text-2xl font-bold text-gray-300 tracking-tight">{targetHours}h</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-lg transition-all ${
            diff === 0
              ? "bg-blue-50 text-blue-600"
              : isOver
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {diff !== 0 && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d={isOver ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
              />
            </svg>
          )}
          {diffText}
        </div>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
              : "bg-gradient-to-r from-red-400 to-rose-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Moniteur : stats d'activité ───────────────────────────
interface MonitorStatsData {
  totalHours: number;
  kiteCoursesCount: number;
  wingCoursesCount: number;
  kiteStudents: number;
  wingStudents: number;
}

interface StatTileProps {
  label: string;
  value: number | string;
  unit?: string;
  color: string;
  icon: React.ReactNode;
}

function StatTile({ label, value, unit, color, icon }: StatTileProps) {
  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl ${color}`}>
      <div className="flex items-center gap-1.5">
        <div className="opacity-60">{icon}</div>
        <p className="text-[11px] font-medium text-gray-500 leading-tight">{label}</p>
      </div>
      <p className="text-xl font-bold text-gray-900 tracking-tight leading-none">
        {value}
        {unit && <span className="text-sm font-semibold text-gray-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function MonitorSummary({ stats }: { stats: MonitorStatsData }) {
  return (
    <div className="border-t border-gray-100 bg-white/60 backdrop-blur-sm px-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatTile
          label="Heures effectuées"
          value={stats.totalHours.toFixed(1).replace(".0", "")}
          unit="h"
          color="bg-indigo-50"
          icon={
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatTile
          label="Cours Kitesurf"
          value={stats.kiteCoursesCount}
          color="bg-sky-50"
          icon={
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
        <StatTile
          label="Cours Wingfoil"
          value={stats.wingCoursesCount}
          color="bg-violet-50"
          icon={
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          }
        />
        <StatTile
          label="Stagiaires Kite"
          value={stats.kiteStudents}
          color="bg-sky-50"
          icon={
            <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatTile
          label="Stagiaires Wing"
          value={stats.wingStudents}
          color="bg-violet-50"
          icon={
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

// ── Export principal ──────────────────────────────────────
interface HoursSummaryProps {
  userRole: UserRole;
  totalHours: number;
  kiteCoursesCount?: number;
  wingCoursesCount?: number;
  kiteStudents?: number;
  wingStudents?: number;
}

export default function HoursSummary({
  userRole,
  totalHours,
  kiteCoursesCount = 0,
  wingCoursesCount = 0,
  kiteStudents = 0,
  wingStudents = 0,
}: HoursSummaryProps) {
  if (userRole === "AIDE_MONO") {
    return <AideMonoSummary totalHours={totalHours} />;
  }

  return (
    <MonitorSummary
      stats={{ totalHours, kiteCoursesCount, wingCoursesCount, kiteStudents, wingStudents }}
    />
  );
}
