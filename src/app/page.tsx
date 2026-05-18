"use client";

import { useState, useEffect } from "react";
import LockScreen from "@/components/auth/LockScreen";
import Sidebar from "@/components/sidebar/Sidebar";
import WeeklyPlanner from "@/components/planning/WeeklyPlanner";
import { User } from "@/types";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem("planning_auth");
    if (auth === "true") {
      setAuthenticated(true);
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
      if (data.length > 0) setActiveUserId(data[0].id);
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock() {
    setAuthenticated(true);
    loadUsers();
  }

  function handleUsersChange(updated: User[]) {
    setUsers(updated);
    if (activeUserId && !updated.find((u) => u.id === activeUserId)) {
      setActiveUserId(updated.length > 0 ? updated[0].id : null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const activeUser = users.find((u) => u.id === activeUserId) ?? null;

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar
        users={users}
        activeUserId={activeUserId}
        onSelectUser={setActiveUserId}
        onUsersChange={handleUsersChange}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {users.length === 0 ? "Aucun utilisateur créé" : "Sélectionnez un utilisateur"}
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              {users.length === 0
                ? "Créez votre premier utilisateur dans la barre latérale pour commencer."
                : "Choisissez un utilisateur dans la barre latérale pour afficher son planning."}
            </p>
          </div>
        ) : (
          <WeeklyPlanner user={activeUser} />
        )}
      </main>
    </div>
  );
}
