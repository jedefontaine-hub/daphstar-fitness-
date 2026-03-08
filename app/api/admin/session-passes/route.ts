import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getCustomersWithExpiredPasses, purchaseSessionPass } from "@/lib/db-store";
import { prisma } from "@/lib/db";

// GET /api/admin/session-passes - Get customers with expired/low passes
export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const expiredPasses = await getCustomersWithExpiredPasses();

    const lowPasses = await prisma.customer.findMany({
      where: {
        sessionPassRemaining: {
          gte: 1,
          lte: 2,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        retirementVillage: true,
        sessionPassRemaining: true,
      },
    });

    return NextResponse.json({
      expired: expiredPasses,
      low: lowPasses,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/session-passes - Purchase new pass for a customer
export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, sessionCount } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    await purchaseSessionPass(customerId, sessionCount || 10);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to purchase pass" }, { status: 500 });
  }
}
