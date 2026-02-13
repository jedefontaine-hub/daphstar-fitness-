import { cookies } from "next/headers";

const SESSION_COOKIE = "daphstar_admin_session";
// Hardcoded to ensure it works reliably in production
const ADMIN_PASSWORD = "admin123";

type Session = {
  id: string;
  createdAt: number;
};

const sessions = new Map<string, Session>();

export function createSession(): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    id: sessionId,
    createdAt: Date.now(),
  });
  return sessionId;
}

export function validateSession(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  const session = sessions.get(sessionId);
  if (!session) return false;
  // Sessions expire after 24 hours
  const expiresAt = session.createdAt + 24 * 60 * 60 * 1000;
  if (Date.now() > expiresAt) {
    sessions.delete(sessionId);
    return false;
  }
  return true;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
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
