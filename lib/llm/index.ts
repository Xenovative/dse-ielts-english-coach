import { MockFeedbackProvider } from "./mock-provider";
import {
  openAiProvider,
  ollamaProvider,
  groqProvider,
  openRouterProvider,
} from "./llm-provider";
import type { FeedbackProvider } from "./types";

async function ollamaReachable(): Promise<boolean> {
  const base = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * AI_PROVIDER: openrouter | openai | groq | ollama | mock | auto
 */
export function getFeedbackProvider(): FeedbackProvider {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("[llm] AI_PROVIDER=openrouter but OPENROUTER_API_KEY missing");
      return getFeedbackProviderFromAuto();
    }
    return openRouterProvider();
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[llm] AI_PROVIDER=openai but OPENAI_API_KEY missing; using mock");
      return new MockFeedbackProvider();
    }
    return openAiProvider();
  }

  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      console.warn("[llm] AI_PROVIDER=groq but GROQ_API_KEY missing");
      return getFeedbackProviderFromAuto();
    }
    return groqProvider();
  }

  if (provider === "ollama") return ollamaProvider();
  if (provider === "mock") return new MockFeedbackProvider();

  return getFeedbackProviderFromAuto();
}

function getFeedbackProviderFromAuto(): FeedbackProvider {
  if (process.env.OPENROUTER_API_KEY) return openRouterProvider();
  if (process.env.GROQ_API_KEY) return groqProvider();
  if (process.env.OPENAI_API_KEY) return openAiProvider();
  return ollamaProvider();
}

export async function resolveFeedbackProvider(): Promise<FeedbackProvider> {
  const provider = (process.env.AI_PROVIDER || "auto").toLowerCase();
  if (provider !== "auto") return getFeedbackProvider();

  if (process.env.OPENROUTER_API_KEY) return openRouterProvider();
  if (process.env.GROQ_API_KEY) return groqProvider();
  if (process.env.OPENAI_API_KEY) return openAiProvider();
  if (await ollamaReachable()) return ollamaProvider();
  console.warn("[llm] No AI provider configured; using mock");
  return new MockFeedbackProvider();
}

export type { FeedbackProvider, FeedbackRequest } from "./types";
