import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerById, updateCustomerProfile } from "@/lib/db-store";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("customer_session");
  
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  try {
    const session = JSON.parse(sessionCookie.value);
    const customer = await getCustomerById(session.customerId);
    
    if (!customer) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    
    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("customer_session");
  
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  
  try {
    const session = JSON.parse(sessionCookie.value);
    const body = await request.json();
    
    const result = await updateCustomerProfile(session.customerId, {
      name: body.name,
      email: body.email,
      retirementVillage: body.retirementVillage,
      birthdate: body.birthdate,
      phone: body.phone,
      address: body.address,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
    });
    
    if (!result.ok) {
      const statusMap: Record<string, number> = {
        not_found: 404,
        email_exists: 409,
      };
      return NextResponse.json(
        { error: result.error },
        { status: statusMap[result.error] ?? 400 }
      );
    }
    
    // Update the session cookie with new name/email if changed
    const newSession = {
      ...session,
      name: result.customer.name,
      email: result.customer.email,
      retirementVillage: result.customer.retirementVillage,
    };
    
    cookieStore.set("customer_session", JSON.stringify(newSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    return NextResponse.json({ customer: result.customer });
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}
