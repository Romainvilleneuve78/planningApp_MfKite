"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { User, UserRole, ROLES, ROLE_LABELS } from "@/types";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4", "#84cc16", "#a855f7",
];

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  AIDE_MONO: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  MONITEUR_KITE_WING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  MONITEUR_WING: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
    </svg>
  ),
};

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: User | null;
  onSuccess: (user: User) => void;
}

export default function CreateUserModal({ isOpen, onClose, editUser, onSuccess }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync fields when editUser changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(editUser?.name ?? "");
      setColor(editUser?.color ?? COLORS[0]);
      setRole(editUser?.role ?? null);
      setError("");
    }
  }, [isOpen, editUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est requis"); return; }
    if (!role) { setError("Le rôle est requis"); return; }

    setLoading(true);
    setError("");

    try {
      const body = { name, color, role };
      const res = editUser
        ? await fetch(`/api/users/${editUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur");
      }
      const user = await res.json();
      onSuccess(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nom */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Marie Dupont"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all text-sm"
            autoFocus
          />
        </div>

        {/* Rôle */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Rôle <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2">
            {ROLES.map((r) => {
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-indigo-300 bg-indigo-50 shadow-sm shadow-indigo-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      selected
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {ROLE_ICONS[r.value]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${selected ? "text-indigo-700" : "text-gray-800"}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{r.description}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Couleur */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Couleur</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
                  color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !role}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "Enregistrement..." : editUser ? "Modifier" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
