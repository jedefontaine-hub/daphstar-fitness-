import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isAdminAuthenticated } from "@/lib/auth";

const prisma = new PrismaClient();

// DELETE - Delete village
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await prisma.village.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting village:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PATCH - Update village name
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name_required" },
        { status: 400 }
      );
    }

    // Check if another village with this name exists
    const existing = await prisma.village.findFirst({
      where: {
        name: name.trim(),
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "village_exists" },
        { status: 400 }
      );
    }

    const village = await prisma.village.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(village);
  } catch (error) {
    console.error("Error updating village:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
