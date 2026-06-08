"use client";

import { useState, useEffect } from "react";
import LockScreen from "@/components/auth/LockScreen";
import Sidebar from "@/components/sidebar/Sidebar";
import WeeklyPlanner from "@/components/planning/WeeklyPlanner";
import Avatar from "@/components/ui/Avatar";
import { User } from "@/types";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">

      {/* ── MOBILE TOP BAR ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Mon Planning</span>
        </div>

        {activeUser ? (
          <button
            onClick={() => setSidebarOpen(true)}
            className="transition-transform active:scale-95"
          >
            <Avatar name={activeUser.name} color={activeUser.color} size="sm" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          users={users}
          activeUserId={activeUserId}
          onSelectUser={setActiveUserId}
          onUsersChange={handleUsersChange}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
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
    </div>
  );
}
