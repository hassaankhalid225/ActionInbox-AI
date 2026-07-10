import type { ActionType, Intent, EntityType } from "@/lib/constants/enums";

// AI output contract — mirrors TRD §8.2. Every provider must produce this shape.

export type SourceRef = {
  ref: string; // e.g. "transcript:line1" | "message" | "ocr:page1"
  snippet: string;
};

export type AiEntity = {
  type: EntityType;
  value: string;
  confidence: number; // 0..100
  source: string;
  resolvedRef?: string | null;
};

export type AiSuggestedAction = {
  type: ActionType;
  title: string;
  summary: string;
  confidence: number;
  requiresApproval: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  draft?: Record<string, unknown>;
};

export type AiAnalysisResult = {
  intent: Intent;
  secondaryIntent?: Intent | null;
  language: string;
  summary: string;
  confidence: number; // overall 0..100
  entities: AiEntity[];
  suggestedActions: AiSuggestedAction[];
  riskFlags: string[];
  sourceEvidence: SourceRef[];
  // observability / cost metadata
  provider: string;
  model: string;
  latencyMs: number;
  usage: { operation: string; units: number; costCents: number }[];
};

export type AnalyzeInput = {
  text: string; // normalized message text / transcript / OCR text
  channelType: string;
  contactName?: string | null;
  contactLanguage?: string | null;
  attachments?: { kind: string; filename: string }[];
  catalog?: { id: string; name: string; aliases: string[]; priceCents: number; unit: string; taxPercent: number }[];
  lowConfidenceThreshold?: number;
};

export interface AiProvider {
  name: string;
  analyze(input: AnalyzeInput): Promise<AiAnalysisResult>;
  transcribe(input: { filename: string; hint?: string }): Promise<{ text: string; confidence: number; language: string }>;
  ocr(input: { filename: string; hint?: string }): Promise<{ text: string; confidence: number; pages: number }>;
}
