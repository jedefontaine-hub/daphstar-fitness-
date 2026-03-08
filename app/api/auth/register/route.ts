import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/db-store";
import {
  signCustomerAccessToken,
  createRefreshToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = body?.name;
  const email = body?.email;
  const password = body?.password;
  const retirementVillage = body?.retirementVillage;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await registerCustomer({ name, email, password, retirementVillage });

  if (!result.ok) {
    const status = result.error === "email_exists" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const { customer } = result;

  const accessToken = signCustomerAccessToken({
    sub: customer.id,
    email: customer.email,
    name: customer.name,
    retirementVillage: customer.retirementVillage,
  });

  const refreshToken = await createRefreshToken({ customerId: customer.id });

  return NextResponse.json(
    { accessToken, refreshToken, customer },
    { status: 201 }
  );
}
