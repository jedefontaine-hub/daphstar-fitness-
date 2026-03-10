import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Params) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const nextTitle = typeof body?.title === "string" ? body.title.trim() : existing.title;
    const nextMessage = typeof body?.message === "string" ? body.message.trim() : existing.message;
    const nextVillage = typeof body?.village === "string" ? body.village.trim() : existing.village;
    const nextPinned =
      typeof body?.isPinned === "boolean" ? body.isPinned : existing.isPinned;
    const nextActive =
      typeof body?.isActive === "boolean" ? body.isActive : existing.isActive;

    if (!nextTitle || !nextMessage || !nextVillage) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const villageExists = await prisma.village.findUnique({
      where: { name: nextVillage },
      select: { id: true },
    });
    if (!villageExists) {
      return NextResponse.json({ error: "village_not_found" }, { status: 400 });
    }

    if (nextPinned && nextActive) {
      await prisma.announcement.updateMany({
        where: {
          id: { not: id },
          village: nextVillage,
          isPinned: true,
          isActive: true,
        },
        data: { isPinned: false },
      });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: nextTitle,
        message: nextMessage,
        village: nextVillage,
        isPinned: nextPinned,
        isActive: nextActive,
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Params) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
