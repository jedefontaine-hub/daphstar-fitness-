import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const customer = getCustomerFromRequest(request);

  if (!customer) {
    return NextResponse.json({ authenticated: false, customer: null });
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: customer.sub,
      name: customer.name,
      email: customer.email,
      retirementVillage: customer.retirementVillage,
    },
  });
}
