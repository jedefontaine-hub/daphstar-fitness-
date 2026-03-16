import { NextResponse } from "next/server";
import { getCustomerSessionPassWallet } from "@/lib/db-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }

  try {
    const wallet = await getCustomerSessionPassWallet(email);
    return NextResponse.json(wallet);
  } catch (error) {
    console.error("Session pass wallet error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
