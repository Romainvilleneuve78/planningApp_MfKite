import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["AIDE_MONO", "MONITEUR_KITE_WING", "MONITEUR_WING"];

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(users);
}

export async function POST(request: Request) {
  const { name, color, role } = await request.json();

  if (!name?.trim()) {
    return Response.json({ error: "Le nom est requis" }, { status: 400 });
  }

  if (!role || !VALID_ROLES.includes(role)) {
    return Response.json({ error: "Le rôle est requis" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      color: color ?? "#6366f1",
      role,
    },
  });

  return Response.json(user, { status: 201 });
}
