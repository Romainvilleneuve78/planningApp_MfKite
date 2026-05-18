import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, color } = await request.json();

  const user = await prisma.user.update({
    where: { id },
    data: { name: name?.trim(), color },
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
