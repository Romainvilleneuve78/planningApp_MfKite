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
  getISOWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Task, User, isKiteTask, isWingTask } from "@/types";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import HoursSummary from "./HoursSummary";
import ImageCourseModal from "./ImageCourseModal";

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
const DAYS_FULL_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function getTodayIndexInWeek(weekDays: Date[]): number {
  for (let i = 0; i < weekDays.length; i++) {
    if (isToday(weekDays[i])) return i;
  }
  return 0;
}

export default function WeeklyPlanner({ user }: WeeklyPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalDate, setImageModalDate] = useState<string>("");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Reset active day when week changes
  useEffect(() => {
    setActiveDayIndex(getTodayIndexInWeek(weekDays));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.toISOString()]);

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

  function goToPrevDay() {
    if (activeDayIndex > 0) {
      setActiveDayIndex(activeDayIndex - 1);
    } else {
      setCurrentWeek(subWeeks(currentWeek, 1));
      setActiveDayIndex(6);
    }
  }

  function goToNextDay() {
    if (activeDayIndex < 6) {
      setActiveDayIndex(activeDayIndex + 1);
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
      setActiveDayIndex(0);
    }
  }

  function goToToday() {
    setCurrentWeek(new Date());
    setActiveDayIndex(getTodayIndexInWeek(weekDays));
  }

  const totalHours = tasks.reduce(
    (acc, t) => acc + calcDurationHours(t.startTime, t.endTime),
    0
  );

  // Stats moniteur
  const kiteCoursesCount = tasks.filter((t) => isKiteTask(t.title)).length;
  const wingCoursesCount = tasks.filter((t) => isWingTask(t.title)).length;
  const kiteStudents = tasks
    .filter((t) => isKiteTask(t.title))
    .reduce((acc, t) => acc + (t.studentCount ?? 0), 0);
  const wingStudents = tasks
    .filter((t) => isWingTask(t.title))
    .reduce((acc, t) => acc + (t.studentCount ?? 0), 0);

  function handleExport() {
    const params = new URLSearchParams({
      userId: user.id,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
    window.open(`/api/export?${params}`, "_blank");
  }

  const weekLabel = `${format(weekStart, "d MMM", { locale: fr })} – ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;
  const weekNumber = getISOWeek(weekStart);
  const activeDay = weekDays[activeDayIndex];
  const activeDayTasks = getTasksForDay(activeDay);
  const activeDayHours = activeDayTasks.reduce(
    (acc, t) => acc + calcDurationHours(t.startTime, t.endTime),
    0
  );

  return (
    <div className="flex flex-col h-full">

      {/* ── DESKTOP HEADER ── */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/60 backdrop-blur-sm">
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
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => { setImageModalDate(format(activeDay, "yyyy-MM-dd")); setImageModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100"
            title="Importer depuis photo"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Photo
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

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-100">
        {/* Week row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">Semaine {weekNumber}</p>
            <p className="text-xs font-semibold text-gray-700 capitalize">{weekLabel}</p>
          </div>

          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day navigation row */}
        <div className="flex items-center px-4 pb-3 gap-2">
          <button
            onClick={goToPrevDay}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors ${
              isToday(activeDay) ? "bg-indigo-50" : "bg-gray-50"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-widest ${isToday(activeDay) ? "text-indigo-500" : "text-gray-400"}`}>
              {DAYS_FULL_FR[activeDayIndex]}
            </p>
            <p className={`text-lg font-bold leading-tight ${isToday(activeDay) ? "text-indigo-700" : "text-gray-900"}`}>
              {format(activeDay, "d MMMM yyyy", { locale: fr })}
            </p>
            {activeDayHours > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{activeDayHours.toFixed(1).replace(".0", "")}h travaillées</p>
            )}
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin text-gray-300 mt-0.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day pills selector */}
        <div className="flex items-center gap-1 px-4 pb-3">
          {weekDays.map((day, i) => {
            const today = isToday(day);
            const active = i === activeDayIndex;
            const dayHours = getTasksForDay(day).reduce(
              (acc, t) => acc + calcDurationHours(t.startTime, t.endTime), 0
            );
            return (
              <button
                key={i}
                onClick={() => setActiveDayIndex(i)}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all ${
                  active
                    ? today
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                      : "bg-gray-800 text-white"
                    : today
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{DAYS_FR[i]}</span>
                <span className="text-sm font-bold">{format(day, "d")}</span>
                {dayHours > 0 && (
                  <span className={`text-[9px] font-medium mt-0.5 ${active ? "opacity-80" : "text-gray-300"}`}>
                    {dayHours.toFixed(1).replace(".0", "")}h
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={goToToday}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 active:bg-indigo-100 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => { setImageModalDate(format(activeDay, "yyyy-MM-dd")); setImageModalOpen(true); }}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 active:bg-indigo-100 transition-colors border border-indigo-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Photo
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
        </div>
      </div>

      {/* ── DESKTOP GRID ── */}
      <div className="hidden md:block flex-1 overflow-auto">
        <div className="grid grid-cols-7 min-w-[700px]">
          {weekDays.map((day, i) => {
            const today = isToday(day);
            const dayTasks = getTasksForDay(day);
            const dayHours = dayTasks.reduce(
              (acc, t) => acc + calcDurationHours(t.startTime, t.endTime), 0
            );
            return (
              <div
                key={i}
                className={`border-r border-gray-100 last:border-r-0 flex flex-col min-h-[calc(100vh-220px)] ${
                  today ? "bg-indigo-50/30" : ""
                }`}
              >
                <div
                  className={`sticky top-0 z-10 px-3 py-3 text-center border-b border-gray-100 ${
                    today ? "bg-indigo-50/80" : "bg-white/80"
                  } backdrop-blur-sm`}
                >
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{DAYS_FR[i]}</p>
                  <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-sm font-semibold ${
                    today ? "bg-indigo-500 text-white shadow-md shadow-indigo-200" : "text-gray-700"
                  }`}>
                    {format(day, "d")}
                  </div>
                  {dayHours > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{dayHours.toFixed(1).replace(".0", "")}h</p>
                  )}
                  <button
                    onClick={() => { setImageModalDate(format(day, "yyyy-MM-dd")); setImageModalOpen(true); }}
                    className="mt-1 w-6 h-6 mx-auto flex items-center justify-center rounded-lg hover:bg-indigo-100 text-gray-300 hover:text-indigo-500 transition-colors"
                    title="Importer depuis photo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 p-2 space-y-1.5">
                  {dayTasks.map((task) => (
                    <TaskCard key={task.id} task={task} color={user.color} onClick={() => openEditTask(task)} />
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

      {/* ── MOBILE SINGLE DAY VIEW ── */}
      <div className="md:hidden flex-1 overflow-auto">
        <div className="p-4 space-y-2 min-h-full">
          {activeDayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium">Aucune tâche ce jour</p>
            </div>
          ) : (
            activeDayTasks.map((task) => (
              <TaskCard key={task.id} task={task} color={user.color} onClick={() => openEditTask(task)} />
            ))
          )}

          <button
            onClick={() => openAddTask(format(activeDay, "yyyy-MM-dd"))}
            className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium text-indigo-500 bg-indigo-50 active:bg-indigo-100 rounded-2xl transition-colors border border-dashed border-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une tâche
          </button>
        </div>
      </div>

      {/* Hours summary */}
      <HoursSummary
        userRole={user.role}
        totalHours={totalHours}
        kiteCoursesCount={kiteCoursesCount}
        wingCoursesCount={wingCoursesCount}
        kiteStudents={kiteStudents}
        wingStudents={wingStudents}
      />

      {/* Task modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(null); }}
        date={selectedDate}
        userId={user.id}
        userRole={user.role}
        task={selectedTask}
        onSuccess={handleTaskSaved}
        onDelete={handleTaskDeleted}
      />

      {/* Image course modal */}
      <ImageCourseModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        date={imageModalDate}
        userId={user.id}
        userRole={user.role}
        onSuccess={(newTasks) => {
          setTasks((prev) => [...prev, ...newTasks]);
        }}
      />
    </div>
  );
}
