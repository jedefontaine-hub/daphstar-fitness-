import { NextResponse } from "next/server";
import { loginCustomer } from "@/lib/db-store";

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
  
  // Create session cookie
  const sessionData = JSON.stringify({
    customerId: result.customer.id,
    email: result.customer.email,
    name: result.customer.name,
    retirementVillage: result.customer.retirementVillage,
  });
  
  const response = NextResponse.json({ customer: result.customer });
  response.cookies.set("customer_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  
  return response;
}
