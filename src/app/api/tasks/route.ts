import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  if (!userId || !weekStart || !weekEnd) {
    return Response.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      date: { gte: new Date(weekStart), lte: new Date(weekEnd) },
    },
    orderBy: { startTime: "asc" },
  });

  return Response.json(tasks);
}

export async function POST(request: Request) {
  const { title, description, startTime, endTime, date, userId, studentCount } =
    await request.json();

  if (!title?.trim() || !startTime || !endTime || !date || !userId) {
    return Response.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      startTime,
      endTime,
      date: new Date(date),
      userId,
      studentCount: typeof studentCount === "number" ? studentCount : null,
    },
  });

  return Response.json(task, { status: 201 });
}
