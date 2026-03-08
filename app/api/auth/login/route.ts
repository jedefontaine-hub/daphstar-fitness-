import { NextResponse } from "next/server";
import { loginCustomer } from "@/lib/db-store";
import {
  signCustomerAccessToken,
  createRefreshToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const email = body?.email;
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await loginCustomer(email, password);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const { customer } = result;

  const accessToken = signCustomerAccessToken({
    sub: customer.id,
    email: customer.email,
    name: customer.name,
    retirementVillage: customer.retirementVillage,
  });

  const refreshToken = await createRefreshToken({ customerId: customer.id });

  return NextResponse.json({ accessToken, refreshToken, customer });
}
