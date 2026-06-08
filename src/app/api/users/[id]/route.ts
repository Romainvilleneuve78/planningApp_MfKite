import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["AIDE_MONO", "MONITEUR_KITE_WING", "MONITEUR_WING"];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, color, role } = await request.json();

  if (role && !VALID_ROLES.includes(role)) {
    return Response.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(color && { color }),
      ...(role && { role }),
    },
  });

  return Response.json(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
