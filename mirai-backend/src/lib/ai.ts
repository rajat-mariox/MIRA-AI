import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Provider-agnostic AI chat interface. Modules call `generateReply()` and never touch a
 * provider SDK directly, so the provider can be swapped by editing this file only.
 *
 *   if (!isAiConfigured()) throw new ApiError(503, 'chat.aiNotConfigured');
 *   const { text, usage } = await generateReply({ system, messages });
 *
 * Providers (env AI_PROVIDER):
 *   - 'anthropic' (default): Claude via @anthropic-ai/sdk. Needs ANTHROPIC_API_KEY.
 *   - 'openai': OpenAI Chat Completions (OPENAI_MODEL, default gpt-4o-mini). Needs OPENAI_API_KEY.
 *   - 'mock': canned reply, no network. Dev/QA only - ignored (treated as not configured) in production.
 */

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Public http(s) image URLs attached to this message (vision). */
  imageUrls?: string[];
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiReply {
  text: string;
  usage: AiUsage;
  /** Model that actually produced the reply. */
  model: string;
  stopReason: string | null;
}

export interface GenerateReplyInput {
  system: string;
  /** Oldest -> newest. Must start with a 'user' message. */
  messages: AiMessage[];
  maxTokens?: number;
}

/** Thrown when the provider call fails (network, auth, refusal, empty reply...). */
export class AiProviderError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

const REQUEST_TIMEOUT_MS = 60_000;

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1']);

function provider(): 'anthropic' | 'openai' | 'mock' | null {
  if (env.AI_PROVIDER === 'mock') return env.isProd ? null : 'mock';
  if (env.AI_PROVIDER === 'openai') return env.OPENAI_API_KEY ? 'openai' : null;
  return env.ANTHROPIC_API_KEY ? 'anthropic' : null;
}

/** True if a reply can be generated right now (check BEFORE persisting anything). */
export function isAiConfigured(): boolean {
  return provider() !== null;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 });
  }
  return client;
}

function toAnthropicMessages(messages: AiMessage[]): Anthropic.Beta.BetaMessageParam[] {
  return messages.map((m) => {
    const images = m.role === 'user' ? (m.imageUrls ?? []) : [];
    if (!images.length) return { role: m.role, content: m.content };
    const content: Anthropic.Beta.BetaContentBlockParam[] = [
      ...images.map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } })),
      { type: 'text' as const, text: m.content },
    ];
    return { role: m.role, content };
  });
}

async function anthropicReply(input: GenerateReplyInput): Promise<AiReply> {
  const model = env.ANTHROPIC_MODEL;
  const useFallback = FALLBACK_MODELS.has(model);
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await getClient().beta.messages.create({
      model,
      max_tokens: input.maxTokens ?? env.CHAT_MAX_TOKENS,
      system: input.system,
      messages: toAnthropicMessages(input.messages),
      // Conversational chat: low effort keeps replies fast and cheap.
      output_config: { effort: 'low' },
      // Server-side refusal fallback: if the model declines, the API retries on a fallback model.
      ...(useFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      logger.error({ status: err.status, message: err.message }, '[ai] Anthropic API error');
    } else {
      logger.error({ err }, '[ai] Anthropic request failed');
    }
    throw new AiProviderError('AI request failed', err);
  }

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (response.stop_reason === 'refusal' && !text) {
    logger.warn({ stopDetails: response.stop_details }, '[ai] reply refused');
    throw new AiProviderError('AI declined to answer');
  }
  if (!text) throw new AiProviderError(`Empty AI reply (stop_reason=${response.stop_reason})`);

  return {
    text,
    usage: { inputTokens: response.usage.input_tokens ?? 0, outputTokens: response.usage.output_tokens ?? 0 },
    model: response.model,
    stopReason: response.stop_reason ?? null,
  };
}

type OpenAiContent = string | ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];

async function openaiReply(input: GenerateReplyInput): Promise<AiReply> {
  const messages: { role: 'system' | 'user' | 'assistant'; content: OpenAiContent }[] = [
    { role: 'system', content: input.system },
    ...input.messages.map((m) => {
      const images = m.role === 'user' ? (m.imageUrls ?? []) : [];
      if (!images.length) return { role: m.role, content: m.content };
      return {
        role: m.role,
        content: [
          { type: 'text' as const, text: m.content },
          ...images.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
        ],
      };
    }),
  ];

  let body: {
    model?: string;
    choices?: { message?: { content?: string | null }; finish_reason?: string | null }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: env.OPENAI_MODEL, max_tokens: input.maxTokens ?? env.CHAT_MAX_TOKENS, messages }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    body = (await res.json()) as typeof body;
    if (!res.ok) {
      logger.error({ status: res.status, message: body.error?.message }, '[ai] OpenAI API error');
      throw new AiProviderError(`OpenAI error ${res.status}`);
    }
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    logger.error({ err }, '[ai] OpenAI request failed');
    throw new AiProviderError('AI request failed', err);
  }

  const choice = body.choices?.[0];
  const text = (choice?.message?.content ?? '').trim();
  if (!text) throw new AiProviderError(`Empty AI reply (finish_reason=${choice?.finish_reason})`);
  return {
    text,
    usage: { inputTokens: body.usage?.prompt_tokens ?? 0, outputTokens: body.usage?.completion_tokens ?? 0 },
    model: body.model ?? env.OPENAI_MODEL,
    stopReason: choice?.finish_reason ?? null,
  };
}

/** Dev-only canned reply (AI_PROVIDER=mock). Echoes the question so flows are easy to verify. */
async function mockReply(input: GenerateReplyInput): Promise<AiReply> {
  const last = input.messages[input.messages.length - 1];
  const images = last?.imageUrls?.length ?? 0;
  const text =
    `[mock] The stars have heard you. You asked: "${(last?.content ?? '').slice(0, 200)}"` +
    (images ? ` (with ${images} image${images > 1 ? 's' : ''})` : '') +
    `. History: ${input.messages.length} message(s).`;
  return {
    text,
    usage: { inputTokens: Math.ceil((input.system.length + JSON.stringify(input.messages).length) / 4), outputTokens: Math.ceil(text.length / 4) },
    model: 'mock',
    stopReason: 'end_turn',
  };
}

/** Generate the assistant reply for a conversation. Throws AiProviderError on failure. */
export async function generateReply(input: GenerateReplyInput): Promise<AiReply> {
  const p = provider();
  if (p === 'mock') return mockReply(input);
  if (p === 'anthropic') return anthropicReply(input);
  if (p === 'openai') return openaiReply(input);
  throw new AiProviderError('AI provider not configured');
}
