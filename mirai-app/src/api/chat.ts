import { CHAT_TIMEOUT_MS } from '../config';
import { ApiError, request } from './client';

export type ChatSession = {
  id: string;
  _id: string;
  title: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ChatMessageDto = {
  id: string;
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  text: string;
  imageUrls: string[];
  status: string;
  model: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** A plan the user bought (POST /plans/:id/purchase) */
export type ChatSubscription = {
  id: string;
  _id: string;
  planId: string;
  /** "5 Questions" */
  title: string;
  planType: string;
  isUnlimited: boolean;
  questionsTotal: number | null;
  questionsUsed: number;
  /** null = unlimited */
  questionsRemaining: number | null;
  startsAt: string;
  /** null = never expires */
  expiresAt: string | null;
  status: string;
};

/** GET /chat/quota: free questions left + the plan the next question will use */
export type ChatQuota = {
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  subscription: ChatSubscription | null;
  canAsk: boolean;
};

export type Pagination = { page: number; limit: number; total: number; totalPages: number };

/** POST /chat/sessions */
export async function createSession(title?: string) {
  const body = title ? { title } : {};
  return (await request<{ session: ChatSession }>('/chat/sessions', { method: 'POST', body })).session;
}

/** GET /chat/sessions (newest first) */
export function listSessions(page = 1, limit = 20) {
  return request<{ sessions: ChatSession[]; pagination: Pagination }>('/chat/sessions', {
    query: { page, limit },
  });
}

/** GET /chat/sessions/:id/messages: items oldest -> newest */
export function listMessages(sessionId: string, opts: { limit?: number; before?: string } = {}) {
  return request<{
    session: ChatSession;
    messages: ChatMessageDto[];
    pagination: Pagination & { hasMore: boolean; nextBefore: string | null };
  }>(`/chat/sessions/${sessionId}/messages`, {
    query: { limit: opts.limit ?? 50, before: opts.before },
  });
}

/** GET /chat/quota */
export function getChatQuota() {
  return request<ChatQuota>('/chat/quota');
}

/**
 * The quota sent with a 402 'chat.limitReached' (no free question or plan left), else null.
 * The user then has to pick a plan.
 */
export function planRequired(err: unknown): ChatQuota | null {
  if (!(err instanceof ApiError) || err.statusCode !== 402) return null;
  const data = err.data as { requiresPlan?: boolean; quota?: ChatQuota } | undefined;
  return data?.requiresPlan && data.quota ? data.quota : null;
}

/** POST /chat/sessions/:id/messages: the saved user message + the AI reply + the updated quota */
export function sendMessage(sessionId: string, content: string) {
  return request<{ userMessage: ChatMessageDto; assistantMessage: ChatMessageDto; quota: ChatQuota }>(
    `/chat/sessions/${sessionId}/messages`,
    { method: 'POST', body: { content }, timeoutMs: CHAT_TIMEOUT_MS },
  );
}
