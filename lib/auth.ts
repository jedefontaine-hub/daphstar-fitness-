import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;

const ACCESS_TOKEN_EXPIRES = "15m";
const ADMIN_ACCESS_TOKEN_EXPIRES = "7d";
const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---- Customer JWT ----

export type CustomerTokenPayload = {
  sub: string; // customerId
  email: string;
  name: string;
  retirementVillage?: string;
  type: "customer";
};

export function signCustomerAccessToken(
  payload: Omit<CustomerTokenPayload, "type">
): string {
  return jwt.sign(
    { ...payload, type: "customer" },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
}

export function verifyCustomerAccessToken(
  token: string
): CustomerTokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as CustomerTokenPayload;
  } catch {
    return null;
  }
}

// ---- Admin JWT ----

export type AdminTokenPayload = {
  sub: "admin";
  type: "admin";
};

export function signAdminAccessToken(): string {
  return jwt.sign(
    { sub: "admin", type: "admin" },
    JWT_ACCESS_SECRET,
    { expiresIn: ADMIN_ACCESS_TOKEN_EXPIRES }
  );
}

export function verifyAdminAccessToken(token: string): AdminTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as AdminTokenPayload;
    if (payload.type !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Refresh Token DB Operations ----

export async function createRefreshToken(options: {
  customerId?: string;
  isAdmin?: boolean;
}): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await prisma.refreshToken.create({
    data: {
      token,
      customerId: options.customerId,
      isAdmin: options.isAdmin ?? false,
      expiresAt,
    },
  });
  return token;
}

export async function rotateRefreshToken(oldToken: string): Promise<{
  newRefreshToken: string;
  customerId?: string;
  isAdmin: boolean;
} | null> {
  const record = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  });
  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt < new Date()) return null;

  await prisma.refreshToken.update({
    where: { token: oldToken },
    data: { revokedAt: new Date() },
  });

  const newToken = await createRefreshToken({
    customerId: record.customerId ?? undefined,
    isAdmin: record.isAdmin,
  });

  return {
    newRefreshToken: newToken,
    customerId: record.customerId ?? undefined,
    isAdmin: record.isAdmin,
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken
    .update({ where: { token }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

// ---- Password Utilities ----

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export async function verifyAdminPassword(plaintext: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) return false;
  return bcrypt.compare(plaintext, ADMIN_PASSWORD_HASH);
}

// ---- Request Auth Helpers ----

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function extractCookieToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (trimmed.startsWith("admin_access_token=")) {
      const value = trimmed.slice("admin_access_token=".length);
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function getCustomerFromRequest(
  request: Request
): CustomerTokenPayload | null {
  const token = extractBearerToken(request);
  if (!token) return null;
  return verifyCustomerAccessToken(token);
}

export function getAdminFromRequest(
  request: Request
): AdminTokenPayload | null {
  const token = extractBearerToken(request) ?? extractCookieToken(request);
  if (!token) return null;
  return verifyAdminAccessToken(token);
}
