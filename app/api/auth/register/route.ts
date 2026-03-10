import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/db-store";
import {
  signCustomerAccessToken,
  createRefreshToken,
} from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = body?.name;
  const email = body?.email;
  const password = body?.password;
  const retirementVillage = body?.retirementVillage;
  const birthdate = body?.birthdate;
  const emergencyContactName = body?.emergencyContactName;
  const emergencyContactPhone = body?.emergencyContactPhone;

  if (!name || !email || !password || !retirementVillage || !birthdate || !emergencyContactName || !emergencyContactPhone) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await registerCustomer({ name, email, password, retirementVillage, birthdate, emergencyContactName, emergencyContactPhone });

  if (!result.ok) {
    const status = result.error === "email_exists" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const { customer } = result;

  sendWelcomeEmail({
    customerEmail: customer.email,
    customerName: customer.name,
  });

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
