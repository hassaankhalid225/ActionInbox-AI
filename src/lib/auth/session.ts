import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "./cookie";

export { SESSION_COOKIE };
const secret = new TextEncoder().encode(env.AUTH_SECRET);
const maxAgeSeconds = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

export type SessionClaims = { sub: string; sid: string };

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

/** Create a DB-backed session and return a signed JWT cookie value. */
export async function createSession(
  userId: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash: sha256(raw),
      userAgent: meta?.userAgent?.slice(0, 300),
      ip: meta?.ip,
      expiresAt,
    },
  });

  const jwt = await new SignJWT({ sub: userId, sid: session.id } satisfies SessionClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.SESSION_MAX_AGE_DAYS}d`)
    .sign(secret);

  return jwt;
}

export async function setSessionCookie(jwt: string) {
  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub === "string" && typeof payload.sid === "string") {
      return { sub: payload.sub, sid: payload.sid };
    }
    return null;
  } catch {
    return null;
  }
}

/** Resolve the current session, checking DB revocation/expiry. */
export async function readSession(): Promise<SessionClaims | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await db.session.findUnique({ where: { id: claims.sid } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return claims;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      await db.session.updateMany({ where: { id: claims.sid }, data: { revokedAt: new Date() } });
    }
  }
  await clearSessionCookie();
}
