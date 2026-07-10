import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { Errors } from "@/lib/api/errors";
import { slugify } from "@/lib/utils/format";
import { PLANS } from "@/lib/constants/plans";
import { recordAudit } from "./audit";

const AVATAR_COLORS = ["#4f46e5", "#0ea5e9", "#16a34a", "#f59e0b", "#db2777", "#7c3aed", "#0891b2"];
function pickColor(seed: string) {
  const i = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[i % AVATAR_COLORS.length]!;
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "workspace";
  let n = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${n++}`;
  }
  return slug;
}

/** Create the first user + their organization (owner) + trial subscription. */
export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  orgName: string;
}): Promise<{ userId: string; orgId: string }> {
  const email = input.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw Errors.conflict("An account with this email already exists.");

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(input.orgName);
  const plan = PLANS.team;
  const period = new Date().toISOString().slice(0, 7);

  const org = await db.organization.create({
    data: {
      name: input.orgName,
      slug,
      onboardingStep: 0,
      subscription: {
        create: {
          plan: "team",
          status: "trialing",
          trialEndsAt: new Date(Date.now() + 14 * 86400000),
          currentPeriodEnd: new Date(Date.now() + 14 * 86400000),
          seats: plan.limits.seats,
        },
      },
      usageCounters: {
        create: [
          { metric: "ai_actions", period, used: 0, limit: plan.limits.aiActions },
          { metric: "ocr_pages", period, used: 0, limit: plan.limits.ocrPages },
          { metric: "voice_minutes", period, used: 0, limit: plan.limits.voiceMinutes },
          { metric: "storage_mb", period, used: 0, limit: plan.limits.storageMb },
          { metric: "seats", period, used: 1, limit: plan.limits.seats },
        ],
      },
    },
  });

  const user = await db.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordHash,
      avatarColor: pickColor(email),
      emailVerified: true, // email verification is stubbed in dev (see README)
      lastLoginAt: new Date(),
      memberships: { create: { orgId: org.id, role: "owner", status: "active", isDefault: true } },
    },
  });

  await recordAudit({ orgId: org.id, actorId: user.id, action: "account.created", targetType: "organization", targetId: org.id });
  return { userId: user.id, orgId: org.id };
}

/** Verify credentials and return the user id. */
export async function authenticate(email: string, password: string): Promise<string> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw Errors.unauthorized("Incorrect email or password.");
  }
  if (user.status === "suspended") throw Errors.forbidden("This account has been suspended.");
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user.id;
}
