import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerDashboard } from "@/lib/db-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("customer_session");

  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    if (!session.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const dashboard = await getCustomerDashboard(session.email);
    return NextResponse.json({
      customer: {
        id: session.customerId,
        name: session.name,
        email: session.email,
        retirementVillage: session.retirementVillage,
      },
      ...dashboard,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "server_error", details: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
