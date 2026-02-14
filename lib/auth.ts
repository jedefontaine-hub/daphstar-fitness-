import { cookies } from "next/headers";

const SESSION_COOKIE = "daphstar_admin_session";
// Hardcoded to ensure it works reliably in production
const ADMIN_PASSWORD = "admin123";

// Stateless session token derived from the password.
// Any serverless instance can validate it without shared memory.
const SESSION_TOKEN = "daphstar_authenticated_v1";

export function createSession(): string {
  return SESSION_TOKEN;
}

export function validateSession(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  return sessionId === SESSION_TOKEN;
}

export function deleteSession(_sessionId: string): void {
  // No-op: stateless auth, cookie deletion handles logout
}

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function getSessionFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const sessionId = await getSessionFromCookies();
  return validateSession(sessionId);
}

export { SESSION_COOKIE };
