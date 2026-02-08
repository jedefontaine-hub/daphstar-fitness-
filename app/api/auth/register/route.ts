import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  
  const name = body?.name;
  const email = body?.email;
  const password = body?.password;
  const retirementVillage = body?.retirementVillage;
  
  if (!name || !email || !password) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  
  const result = registerCustomer({ name, email, password, retirementVillage });
  
  if (!result.ok) {
    const status = result.error === "email_exists" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  
  // Create session cookie
  const sessionData = JSON.stringify({
    customerId: result.customer.id,
    email: result.customer.email,
    name: result.customer.name,
    retirementVillage: result.customer.retirementVillage,
  });
  
  const response = NextResponse.json({ customer: result.customer }, { status: 201 });
  response.cookies.set("customer_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  
  return response;
}
