import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const village = searchParams.get("village")?.trim();

    if (!village) {
      return NextResponse.json({ announcement: null });
    }

    const announcement = await prisma.announcement.findFirst({
      where: {
        village,
        isPinned: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        message: true,
        village: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ announcement: announcement ?? null });
  } catch (error) {
    console.error("Error fetching current announcement:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
