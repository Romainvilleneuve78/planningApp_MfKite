import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type DbTask = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  date: Date;
  userId: string;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function calcDurationHours(start: string, end: string): number {
  return Math.max(0, (timeToMinutes(end) - timeToMinutes(start)) / 60);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  if (!userId || !weekStart || !weekEnd) {
    return Response.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tasks: DbTask[] = await prisma.task.findMany({
    where: {
      userId,
      date: { gte: new Date(weekStart), lte: new Date(weekEnd) },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const rows = tasks.map((t: DbTask) => ({
    Utilisateur: user?.name ?? "",
    Date: t.date.toLocaleDateString("fr-FR"),
    "Heure début": t.startTime,
    "Heure fin": t.endTime,
    "Durée (h)": calcDurationHours(t.startTime, t.endTime).toFixed(2),
    Tâche: t.title,
    Description: t.description ?? "",
  }));

  const totalHours = tasks.reduce(
    (acc: number, t: DbTask) => acc + calcDurationHours(t.startTime, t.endTime),
    0
  );

  rows.push({
    Utilisateur: "",
    Date: "",
    "Heure début": "",
    "Heure fin": "TOTAL",
    "Durée (h)": totalHours.toFixed(2),
    Tâche: "",
    Description: "",
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planning");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="planning-${user?.name ?? "export"}.xlsx"`,
    },
  });
}
