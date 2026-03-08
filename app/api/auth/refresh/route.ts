import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  rotateRefreshToken,
  signCustomerAccessToken,
  signAdminAccessToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const oldRefreshToken = body?.refreshToken;

  if (!oldRefreshToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const result = await rotateRefreshToken(oldRefreshToken);
  if (!result) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  if (result.isAdmin) {
    const accessToken = signAdminAccessToken();
    return NextResponse.json({
      accessToken,
      refreshToken: result.newRefreshToken,
    });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: result.customerId },
  });

  if (!customer) {
    return NextResponse.json({ error: "customer_not_found" }, { status: 404 });
  }

  const accessToken = signCustomerAccessToken({
    sub: customer.id,
    email: customer.email,
    name: customer.name,
    retirementVillage: customer.retirementVillage ?? undefined,
  });

  return NextResponse.json({
    accessToken,
    refreshToken: result.newRefreshToken,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      retirementVillage: customer.retirementVillage,
    },
  });
}
