export type UserRole = "AIDE_MONO" | "MONITEUR_KITE_WING" | "MONITEUR_WING";

export const ROLE_LABELS: Record<UserRole, string> = {
  AIDE_MONO: "Aide Mono",
  MONITEUR_KITE_WING: "Moniteur Kite / Wing",
  MONITEUR_WING: "Moniteur Wing",
};

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: "AIDE_MONO",
    label: "Aide Mono",
    description: "Assistance et support aux moniteurs",
  },
  {
    value: "MONITEUR_KITE_WING",
    label: "Moniteur Kite / Wing",
    description: "Enseignement kitesurf et wing foil",
  },
  {
    value: "MONITEUR_WING",
    label: "Moniteur Wing",
    description: "Enseignement wing foil",
  },
];

export interface User {
  id: string;
  name: string;
  color: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekDay {
  date: Date;
  dateStr: string;
  label: string;
  dayName: string;
}
