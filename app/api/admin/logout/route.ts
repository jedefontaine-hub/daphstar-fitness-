import { NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.refreshToken) {
    await revokeRefreshToken(body.refreshToken);
  }
  return NextResponse.json({ success: true });
}
