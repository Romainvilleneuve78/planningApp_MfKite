"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { Task } from "@/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  userId: string;
  task?: Task | null;
  onSuccess: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const QUICK_TASKS = [
  { title: "Cours kitesurf", duration: 3 },
  { title: "Préparation matériel", duration: 1 },
  { title: "Nettoyage plage", duration: 1.5 },
  { title: "Réunion", duration: 1 },
  { title: "Administratif", duration: 2 },
];

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const endH = Math.min(23, Math.floor(totalMinutes / 60));
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TaskModal({ isOpen, onClose, date, userId, task, onSuccess, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStartTime(task.startTime);
      setEndTime(task.endTime);
    } else {
      setTitle("");
      setDescription("");
      setStartTime("09:00");
      setEndTime("12:00");
    }
    setError("");
  }, [task, isOpen]);

  function applyQuickTask(qt: { title: string; duration: number }) {
    setTitle(qt.title);
    setEndTime(addHours(startTime, qt.duration));
  }

  function getDuration(): string {
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (diff <= 0) return "—";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  }

  function adjustDuration(deltaMinutes: number) {
    const current = timeToMinutes(endTime) - timeToMinutes(startTime);
    const newDuration = Math.max(15, current + deltaMinutes);
    setEndTime(minutesToTime(timeToMinutes(startTime) + newDuration));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Le titre est requis"); return; }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const body = { title, description, startTime, endTime, date, userId };
      const res = task
        ? await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (!res.ok) throw new Error("Erreur");
      const saved = await res.json();
      onSuccess(saved);
      onClose();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!task || !onDelete) return;
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onDelete(task.id);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? "Modifier la tâche" : "Nouvelle tâche"} width="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!task && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Tâches rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TASKS.map((qt) => (
                <button
                  key={qt.title}
                  type="button"
                  onClick={() => applyQuickTask(qt)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  {qt.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Cours kitesurf"
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-sm"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Début</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Durée :</span>
            <span className="text-sm font-semibold text-gray-900">{getDuration()}</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => adjustDuration(-30)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-sm font-bold">−</button>
            <span className="text-xs text-gray-400">30min</span>
            <button type="button" onClick={() => adjustDuration(30)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-sm font-bold">+</button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails, instructions..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-sm resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          {task && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 px-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : task ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
