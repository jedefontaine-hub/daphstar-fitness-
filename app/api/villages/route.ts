import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const villages = await prisma.village.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(villages);
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
