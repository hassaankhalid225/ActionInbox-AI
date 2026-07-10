import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { AiProvider } from "./types";
import { MockAiProvider } from "./mock-provider";

// ---------------------------------------------------------------------------
// AI gateway (TRD §17 — "gateway abstraction from day one"). Selects a provider
// from env. Real providers are stubbed to fall back to the mock when no API key
// is configured, so the product runs end-to-end without credentials.
// ---------------------------------------------------------------------------

class UnconfiguredProvider extends MockAiProvider {
  constructor(private readonly requested: string) {
    super();
    this.name = requested;
    logger.warn("AI provider requested but not configured — using deterministic mock.", { requested });
  }
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;

  switch (env.AI_PROVIDER) {
    case "anthropic":
      // TODO: implement AnthropicProvider (Messages API + tool-forced JSON schema).
      // Requires ANTHROPIC_API_KEY. Falls back to mock until wired.
      cached = env.ANTHROPIC_API_KEY ? new UnconfiguredProvider("anthropic") : new UnconfiguredProvider("anthropic");
      break;
    case "openai":
      // TODO: implement OpenAIProvider (Responses API + structured outputs).
      cached = new UnconfiguredProvider("openai");
      break;
    default:
      cached = new MockAiProvider();
  }
  return cached;
}
