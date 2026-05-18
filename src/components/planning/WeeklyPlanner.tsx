"use client";

import { useState, useEffect, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Task, User } from "@/types";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import HoursSummary from "./HoursSummary";

interface WeeklyPlannerProps {
  user: User;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function calcDurationHours(start: string, end: string): number {
  return Math.max(0, (timeToMinutes(end) - timeToMinutes(start)) / 60);
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function WeeklyPlanner({ user }: WeeklyPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.id,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      });
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, weekStart.toISOString()]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  function getTasksForDay(day: Date): Task[] {
    return tasks
      .filter((t) => isSameDay(parseISO(t.date.toString()), day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function openAddTask(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedTask(null);
    setModalOpen(true);
  }

  function openEditTask(task: Task) {
    setSelectedDate(format(parseISO(task.date.toString()), "yyyy-MM-dd"));
    setSelectedTask(task);
    setModalOpen(true);
  }

  function handleTaskSaved(saved: Task) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      if (exists) return prev.map((t) => (t.id === saved.id ? saved : t));
      return [...prev, saved];
    });
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const totalHours = tasks.reduce(
    (acc, t) => acc + calcDurationHours(t.startTime, t.endTime),
    0
  );

  function handleExport() {
    const params = new URLSearchParams({
      userId: user.id,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
    window.open(`/api/export?${params}`, "_blank");
  }

  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 capitalize">{weekLabel}</h2>
          {loading && (
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-w-[700px]">
          {/* Day headers */}
          {weekDays.map((day, i) => {
            const today = isToday(day);
            const dayTasks = getTasksForDay(day);
            const dayHours = dayTasks.reduce(
              (acc, t) => acc + calcDurationHours(t.startTime, t.endTime),
              0
            );

            return (
              <div
                key={i}
                className={`border-r border-gray-100 last:border-r-0 flex flex-col min-h-[calc(100vh-220px)] ${
                  today ? "bg-indigo-50/30" : ""
                }`}
              >
                {/* Day header */}
                <div
                  className={`sticky top-0 z-10 px-3 py-3 text-center border-b border-gray-100 ${
                    today ? "bg-indigo-50/80" : "bg-white/80"
                  } backdrop-blur-sm`}
                >
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{DAYS_FR[i]}</p>
                  <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-semibold ${
                    today
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                      : "text-gray-700"
                  }`}>
                    {format(day, "d")}
                  </div>
                  {dayHours > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{dayHours.toFixed(1).replace(".0", "")}h</p>
                  )}
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-1.5">
                  {dayTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      color={user.color}
                      onClick={() => openEditTask(task)}
                    />
                  ))}

                  <button
                    onClick={() => openAddTask(format(day, "yyyy-MM-dd"))}
                    className="w-full py-2 flex items-center justify-center gap-1 text-xs text-gray-300 hover:text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all group border border-dashed border-transparent hover:border-indigo-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="group-hover:opacity-100 opacity-0 transition-opacity">Ajouter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hours summary */}
      <HoursSummary totalHours={totalHours} />

      {/* Task modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        date={selectedDate}
        userId={user.id}
        task={selectedTask}
        onSuccess={handleTaskSaved}
        onDelete={handleTaskDeleted}
      />
    </div>
  );
}
