import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("customer_session");
  
  if (!sessionCookie?.value) {
    return NextResponse.json({ authenticated: false, customer: null });
  }
  
  try {
    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({
      authenticated: true,
      customer: {
        id: session.customerId,
        name: session.name,
        email: session.email,
        retirementVillage: session.retirementVillage,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, customer: null });
  }
}
