import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching admin announcements:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const title = body?.title;
    const message = body?.message;
    const village = body?.village;

    if (!title || !message || !village) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const trimmedVillage = String(village).trim();

    const villageExists = await prisma.village.findUnique({
      where: { name: trimmedVillage },
      select: { id: true },
    });

    if (!villageExists) {
      return NextResponse.json({ error: "village_not_found" }, { status: 400 });
    }

    await prisma.announcement.updateMany({
      where: {
        village: trimmedVillage,
        isPinned: true,
        isActive: true,
      },
      data: {
        isPinned: false,
      },
    });

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        message: String(message).trim(),
        village: trimmedVillage,
        isPinned: true,
        isActive: true,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
