import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { isAdminAuthenticated } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - List all villages
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const villages = await prisma.village.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error("Error fetching villages:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// POST - Create new village
export async function POST(request: Request) {
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

    // Check if village already exists
    const existing = await prisma.village.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "village_exists" },
        { status: 400 }
      );
    }

    const village = await prisma.village.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(village);
  } catch (error) {
    console.error("Error creating village:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
