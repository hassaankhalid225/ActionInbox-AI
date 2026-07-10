// Edge-safe constant (no Node deps) so middleware can import it without pulling
// in Prisma/crypto from session.ts.
export const SESSION_COOKIE = "aib_session";
