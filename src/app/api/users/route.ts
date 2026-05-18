import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(users);
}

export async function POST(request: Request) {
  const { name, color } = await request.json();

  if (!name?.trim()) {
    return Response.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: { name: name.trim(), color: color ?? "#6366f1" },
  });

  return Response.json(user, { status: 201 });
}
