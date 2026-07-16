import "server-only";

import { buildGroundedContext, deterministicAssistantResponse, isUnsafeAssistantRequest } from "./assistant-grounding";
import { getAIProvider } from "./runtime-config";

type ProviderName = "openrouter" | "groq" | "gemini" | "demo";
export type AssistantResult = { text: string; mode: "provider" | "demo"; provider: ProviderName; model: string | null; attempted: string[] };
type FreeModel = { id: string; pricing?: { prompt?: string; completion?: string }; architecture?: { modality?: string }; expiration_date?: string | null };

const REQUEST_TIMEOUT_MS = 8000;
const MAX_PROMPT_CHARS = 1200;
const MAX_OUTPUT_TOKENS = 320;
let modelCache: { expiresAt: number; models: FreeModel[] } | null = null;

function safePrompt(prompt: string): string { return prompt.trim().slice(0, MAX_PROMPT_CHARS); }
function timeoutSignal() { return AbortSignal.timeout(REQUEST_TIMEOUT_MS); }
function freeModel(model: FreeModel): boolean { return model.architecture?.modality === "text->text" && model.pricing?.prompt === "0" && model.pricing?.completion === "0" && (!model.expiration_date || Date.parse(model.expiration_date) > Date.now()); }

async function currentFreeModels(): Promise<FreeModel[]> {
  if (modelCache && modelCache.expiresAt > Date.now()) return modelCache.models;
  const response = await fetch("https://openrouter.ai/api/v1/models", { signal: timeoutSignal(), headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`catalogue_http_${response.status}`);
  const payload = await response.json() as { data?: FreeModel[] };
  const models = (payload.data ?? []).filter(freeModel);
  modelCache = { expiresAt: Date.now() + 5 * 60 * 1000, models };
  return models;
}

function requestedModelChain(): string[] { return (process.env.OPENROUTER_MODEL_CHAIN ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 5); }
function buildMessages(prompt: string) { return [{ role: "system", content: `You are Trancense's grounded energy-audit explainer. Never produce authoritative numerical values. Use only the supplied context, state uncertainty, cite IDs, and refuse statutory/legal/certification/control requests.\n\n${buildGroundedContext()}` }, { role: "user", content: safePrompt(prompt) }]; }

async function openRouter(prompt: string): Promise<{ text: string; model: string }> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("openrouter_key_missing");
  const models = await currentFreeModels();
  const available = new Set(models.map((model) => model.id));
  const requested = requestedModelChain().filter((id) => available.has(id));
  const chain = [...requested, ...models.map((model) => model.id).filter((id) => !requested.includes(id))].slice(0, 5);
  if (!chain.length) throw new Error("no_current_free_openrouter_model");
  for (const model of chain) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", signal: timeoutSignal(), headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}), ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}) }, body: JSON.stringify({ model, messages: buildMessages(prompt), temperature: 0.1, max_tokens: MAX_OUTPUT_TOKENS }) });
      if (!response.ok) continue;
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (text) return { text, model };
    } catch { /* Fail over to the next verified free model without retry storms. */ }
  }
  throw new Error("openrouter_models_failed");
}

async function compatibleChat(url: string, apiKey: string, model: string, prompt: string, headers: Record<string, string> = {}) {
  const response = await fetch(url, { method: "POST", signal: timeoutSignal(), headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...headers }, body: JSON.stringify({ model, messages: buildMessages(prompt), temperature: 0.1, max_tokens: MAX_OUTPUT_TOKENS }) });
  if (!response.ok) throw new Error(`provider_http_${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("provider_empty_response");
  return text;
}

async function groq(prompt: string) { if (!process.env.GROQ_API_KEY) throw new Error("groq_key_missing"); return { text: await compatibleChat("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY, process.env.GROQ_MODEL || "llama-3.1-8b-instant", prompt), model: process.env.GROQ_MODEL || "llama-3.1-8b-instant" }; }
async function gemini(prompt: string) { if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error("gemini_key_missing"); const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"; const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GOOGLE_GENERATIVE_AI_API_KEY)}`, { method: "POST", signal: timeoutSignal(), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: buildMessages(prompt)[0].content }] }, contents: [{ role: "user", parts: [{ text: safePrompt(prompt) }] }], generationConfig: { temperature: 0.1, maxOutputTokens: MAX_OUTPUT_TOKENS } }) }); if (!response.ok) throw new Error(`gemini_http_${response.status}`); const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }; const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim(); if (!text) throw new Error("gemini_empty_response"); return { text, model }; }

export async function answerWithGrounding(prompt: string): Promise<AssistantResult> {
  const clean = safePrompt(prompt);
  if (!clean || isUnsafeAssistantRequest(clean)) return { text: deterministicAssistantResponse(clean), mode: "demo", provider: "demo", model: null, attempted: [] };
  const requested = getAIProvider();
  const providers: ProviderName[] = requested === "demo" ? [] : requested === "openrouter" ? ["openrouter"] : requested === "groq" ? ["groq"] : requested === "gemini" ? ["gemini"] : ["openrouter", "groq", "gemini"];
  const attempted: string[] = [];
  for (const provider of providers) {
    attempted.push(provider);
    try {
      const result = provider === "openrouter" ? await openRouter(clean) : provider === "groq" ? await groq(clean) : await gemini(clean);
      console.info("[trancense-assistant] provider_success", { provider, model: result.model });
      return { ...result, mode: "provider", provider, attempted };
    } catch (error) {
      console.info("[trancense-assistant] provider_fallback", { provider, reason: error instanceof Error ? error.message : "unknown" });
    }
  }
  return { text: deterministicAssistantResponse(clean), mode: "demo", provider: "demo", model: null, attempted };
}
