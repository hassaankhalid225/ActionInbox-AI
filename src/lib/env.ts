import { z } from "zod";

// Validated environment. Never hardcode secrets — everything flows through here.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_NAME: z.string().default("ActionInbox AI"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  SESSION_MAX_AGE_DAYS: z.coerce.number().default(30),
  AI_PROVIDER: z.enum(["mock", "anthropic", "openai"]).default("mock"),
  AI_DEFAULT_MODEL: z.string().default("claude-sonnet-5"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  QUEUE_DRIVER: z.enum(["inline", "redis"]).default("inline"),
  BILLING_PROVIDER: z.enum(["mock", "stripe", "paddle"]).default("mock"),
  EMAIL_INBOUND_DOMAIN: z.string().default("inbox.actioninbox.ai"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Fail fast with a readable message rather than obscure runtime errors.
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export type Env = typeof env;
