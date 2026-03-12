import { NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (body?.refreshToken) {
    await revokeRefreshToken(body.refreshToken);
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_access_token", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
