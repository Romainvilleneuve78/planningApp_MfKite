"use client";

import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  color: string;
  onClick: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getDuration(start: string, end: string): string {
  const diff = timeToMinutes(end) - timeToMinutes(start);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export default function TaskCard({ task, color, onClick }: TaskCardProps) {
  const duration = getDuration(task.startTime, task.endTime);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
      style={{
        backgroundColor: `${color}15`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{task.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {task.startTime} – {task.endTime}
            {duration && <span className="ml-1 text-gray-300">· {duration}</span>}
          </p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.description}</p>
          )}
        </div>
        <svg
          className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
    </div>
  );
}
