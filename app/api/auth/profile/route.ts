import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/auth";
import { getCustomerById, updateCustomerProfile } from "@/lib/db-store";

export async function GET(request: Request) {
  const tokenPayload = getCustomerFromRequest(request);

  if (!tokenPayload) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const customer = await getCustomerById(tokenPayload.sub);

  if (!customer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PUT(request: Request) {
  const tokenPayload = getCustomerFromRequest(request);

  if (!tokenPayload) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await updateCustomerProfile(tokenPayload.sub, {
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

  return NextResponse.json({ customer: result.customer });
}
