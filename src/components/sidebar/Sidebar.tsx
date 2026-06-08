"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import CreateUserModal from "./CreateUserModal";
import { User, ROLE_LABELS } from "@/types";

interface SidebarProps {
  users: User[];
  activeUserId: string | null;
  onSelectUser: (userId: string) => void;
  onUsersChange: (users: User[]) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  users,
  activeUserId,
  onSelectUser,
  onUsersChange,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleDelete(user: User) {
    if (!confirm(`Supprimer ${user.name} ? Toutes ses tâches seront supprimées.`)) return;
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    onUsersChange(users.filter((u) => u.id !== user.id));
    setMenuOpen(null);
  }

  function handleUserCreated(user: User) {
    if (editUser) {
      onUsersChange(users.map((u) => (u.id === user.id ? user : u)));
    } else {
      onUsersChange([...users, user]);
      onSelectUser(user.id);
    }
    setEditUser(null);
  }

  function handleSelectUser(userId: string) {
    onSelectUser(userId);
    setMenuOpen(null);
    onMobileClose?.();
  }

  const inner = (
    <div className="w-64 h-full flex flex-col bg-white/90 backdrop-blur-xl border-r border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Mon Planning</span>
          </div>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors md:hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => { setEditUser(null); setShowCreateModal(true); }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel utilisateur
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 font-medium">Aucun utilisateur créé</p>
            <p className="text-xs text-gray-300 mt-1">Cliquez sur &quot;Nouvel utilisateur&quot;</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                activeUserId === user.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              onClick={() => handleSelectUser(user.id)}
            >
              <Avatar name={user.name} color={user.color} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{ROLE_LABELS[user.role]}</p>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === user.id ? null : user.id);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-400 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {menuOpen === user.id && (
                  <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-100 py-1 z-50">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditUser(user); setShowCreateModal(true); setMenuOpen(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(user); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex shrink-0 h-full">
        {inner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative z-10 h-full animate-slide-in-left">
            {inner}
          </div>
        </div>
      )}

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditUser(null); }}
        editUser={editUser}
        onSuccess={handleUserCreated}
      />
    </>
  );
}
