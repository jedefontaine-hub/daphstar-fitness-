import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomersWithExpiredPasses, purchaseSessionPass } from "@/lib/db-store";
import { prisma } from "@/lib/db";

// GET /api/admin/session-passes - Get customers with expired/low passes
export async function GET() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get customers with 0 sessions
    const expiredPasses = await getCustomersWithExpiredPasses();

    // Get customers with low sessions (1-2 remaining)
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/session-passes - Purchase new pass for a customer
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, sessionCount } = await request.json();

    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    await purchaseSessionPass(customerId, sessionCount || 10);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to purchase pass" }, { status: 500 });
  }
}
