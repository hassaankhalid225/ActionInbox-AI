import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/actions",
  "/tasks",
  "/quotes",
  "/invoices",
  "/customers",
  "/catalog",
  "/documents",
  "/workflows",
  "/analytics",
  "/settings",
  "/onboarding",
];

// Auth pages that a signed-in user should be bounced away from.
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

async function isValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await isValidSession(req);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !authed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && authed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets and API/webhooks (those guard themselves).
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest).*)",
  ],
};
