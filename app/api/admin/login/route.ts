import { NextResponse } from "next/server";
import {
  verifyAdminPassword,
  signAdminAccessToken,
  createRefreshToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (!password || !(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const accessToken = signAdminAccessToken();
  const refreshToken = await createRefreshToken({ isAdmin: true });
  const response = NextResponse.json({ accessToken, refreshToken, success: true });
  response.cookies.set("admin_access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
