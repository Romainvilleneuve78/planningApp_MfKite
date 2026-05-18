"use client";

interface HoursSummaryProps {
  totalHours: number;
  targetHours?: number;
}

export default function HoursSummary({ totalHours, targetHours = 35 }: HoursSummaryProps) {
  const diff = totalHours - targetHours;
  const isOver = diff >= 0;
  const diffText = diff === 0 ? "Objectif atteint" : `${isOver ? "+" : ""}${diff.toFixed(1).replace(".0", "")}h`;
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

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-lg transition-all ${
          diff === 0
            ? "bg-blue-50 text-blue-600"
            : isOver
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-500"
        }`}>
          {diff !== 0 && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={isOver ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          )}
          {diffText}
        </div>
      </div>

      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-red-400 to-rose-500"
          }`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
          style={{ left: "100%" }}
        />
      </div>
    </div>
  );
}
