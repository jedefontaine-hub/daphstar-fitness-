import { NextResponse } from "next/server";
import { listBookingsByEmail } from "@/lib/db-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  const bookings = await listBookingsByEmail(email);
  return NextResponse.json({ bookings });
}
