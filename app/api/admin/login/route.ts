import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body && body.password;
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });
    }
    if (!password || password !== expected) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // If ADMIN_TOKEN is configured, set the cookie to that token value (server-side token-based session)
    const token = process.env.ADMIN_TOKEN;
    if (token) {
      res.headers.set('Set-Cookie', `admin_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`);
    } else {
      // fallback for development: set a simple flag cookie
      res.headers.set('Set-Cookie', 'admin_auth=1; Path=/; HttpOnly; SameSite=Lax');
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
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
