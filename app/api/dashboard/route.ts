import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/auth";
import { getCustomerDashboard } from "@/lib/db-store";

export async function GET(request: Request) {
  const tokenPayload = getCustomerFromRequest(request);

  if (!tokenPayload) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const dashboard = await getCustomerDashboard(tokenPayload.email);
    return NextResponse.json({
      customer: {
        id: tokenPayload.sub,
        name: tokenPayload.name,
        email: tokenPayload.email,
        retirementVillage: tokenPayload.retirementVillage,
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
