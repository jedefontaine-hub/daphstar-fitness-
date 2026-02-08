import { NextResponse } from "next/server";
import {
  deleteSession,
  getSessionFromCookies,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST() {
  const sessionId = await getSessionFromCookies();
  if (sessionId) {
    deleteSession(sessionId);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);

  return response;
}
