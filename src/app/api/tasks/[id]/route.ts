import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title, description, startTime, endTime, date, studentCount } =
    await request.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: title?.trim(),
      description: description?.trim() || null,
      startTime,
      endTime,
      date: date ? new Date(date) : undefined,
      studentCount: typeof studentCount === "number" ? studentCount : null,
    },
  });

  return Response.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return Response.json({ success: true });
}
