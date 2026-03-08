import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  return NextResponse.json({ authenticated: !!admin });
}
