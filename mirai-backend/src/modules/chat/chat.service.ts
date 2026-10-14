import { Types } from 'mongoose';
import { env } from '../../config/env';
import { AiProviderError, generateReply, isAiConfigured, type AiMessage } from '../../lib/ai';
import type { Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { DEFAULT_PAGE, paginate } from '../../utils/pagination';
import {
  getQuota,
  releaseQuestion,
  reserveQuestion,
  type ChatQuota,
  type QuestionReservation,
} from '../plan/chatSubscription.service';
import type { UserDocument } from '../user/user.model';
import {
  ChatMessage,
  ChatSession,
  toPublicMessage,
  toPublicSession,
  type PublicChatMessage,
  type PublicChatSession,
} from './chat.model';
import {
  WALLET_BILLING_AVAILABLE,
  chargeForMessage,
  getAstroContext,
  refundMessageCharge,
} from './chat.integrations';
import { buildSystemPrompt, makeTitle } from './chat.prompt';
import type { CreateSessionInput, ListMessagesQuery, ListSessionsQuery, SendMessageInput } from './chat.validation';

/** Messages of history sent to the AI (including the new user message). */
const HISTORY_LIMIT = 20;
const DEFAULT_MESSAGES_LIMIT = 50;
const PREVIEW_LENGTH = 120;

async function getOwnSession(userId: string, sessionId: string) {
  const session = await ChatSession.findOne({ _id: sessionId, userId });
  if (!session) throw ApiError.notFound('chat.sessionNotFound');
  return session;
}

export async function createSession(userId: string, input: CreateSessionInput): Promise<PublicChatSession> {
  const session = await ChatSession.create({ userId, title: input.title ?? null, lastMessageAt: new Date() });
  return toPublicSession(session.toObject());
}

export async function listSessions(userId: string, query: ListSessionsQuery) {
  const result = await paginate<any>(ChatSession, { userId }, query, {
    sort: { lastMessageAt: -1, createdAt: -1 },
  });
  return { sessions: result.items.map(toPublicSession), pagination: result.pagination };
}

export async function listMessages(userId: string, sessionId: string, query: ListMessagesQuery) {
  const session = await getOwnSession(userId, sessionId);
  const limit = query.limit ?? DEFAULT_MESSAGES_LIMIT;
  const baseFilter = { sessionId: session._id };
  const total = await ChatMessage.countDocuments(baseFilter);

  let filter: Record<string, unknown> = baseFilter;
  let page: number | null = null;
  let skip = 0;
  if (query.before) {
    const cursor = await ChatMessage.findOne({ _id: query.before, sessionId: session._id }).select('createdAt').lean();
    if (!cursor) throw ApiError.badRequest('chat.invalidCursor');
    const cursorId = new Types.ObjectId(query.before);
    filter = {
      ...baseFilter,
      $or: [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }],
    };
  } else {
    page = query.page ?? DEFAULT_PAGE;
    skip = (page - 1) * limit;
  }

  // Fetch newest-first (limit + 1 to detect more), then return oldest -> newest.
  const docs = await ChatMessage.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit + 1).lean();
  const hasMore = docs.length > limit;
  const pageDocs = docs.slice(0, limit).reverse();
  const messages = pageDocs.map(toPublicMessage);

  return {
    session: toPublicSession(session.toObject()),
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: page !== null ? Math.ceil(total / limit) : null,
      hasMore,
      /** Pass as `before` to load older messages. */
      nextBefore: hasMore && messages.length ? messages[0]!.id : null,
    },
  };
}

/** GET /chat/quota: free questions left + the active plan. */
export function getChatQuota(userId: string): Promise<ChatQuota> {
  return getQuota(userId);
}

/** Last HISTORY_LIMIT messages, oldest -> newest, starting with a user message. Only the newest message keeps its images. */
async function loadHistory(sessionId: Types.ObjectId): Promise<AiMessage[]> {
  const docs = await ChatMessage.find({ sessionId, status: 'completed' })
    .sort({ createdAt: -1, _id: -1 })
    .limit(HISTORY_LIMIT)
    .select('role content imageUrls')
    .lean();
  docs.reverse();
  while (docs.length && docs[0]!.role !== 'user') docs.shift();
  return docs.map((d, i) => {
    const imgs = d.imageUrls ?? [];
    const isLast = i === docs.length - 1;
    if (isLast) return { role: d.role as AiMessage['role'], content: d.content, imageUrls: imgs };
    // Older images are not re-sent (URLs may have expired); leave a note instead.
    const note = imgs.length ? `\n[The user shared ${imgs.length} image(s) here.]` : '';
    return { role: d.role as AiMessage['role'], content: d.content + note };
  });
}

export async function sendMessage(
  user: UserDocument,
  sessionId: string,
  input: SendMessageInput,
  lang: Lang,
): Promise<{ userMessage: PublicChatMessage; assistantMessage: PublicChatMessage; quota: ChatQuota }> {
  // 1. Fail fast before persisting anything (no orphan messages, no charge).
  if (!isAiConfigured()) throw new ApiError(503, 'chat.aiNotConfigured');
  const userId = String(user._id);
  const session = await getOwnSession(userId, sessionId);

  // 2. Reserve one question: free allowance first, else an active plan.
  //    None left -> 402 'chat.limitReached' with { requiresPlan: true, quota }. Given back on failure.
  const reservation: QuestionReservation = await reserveQuestion(userId);

  // 3. Billing (debit before calling the AI; refunded on failure).
  const price = WALLET_BILLING_AVAILABLE ? env.CHAT_PRICE_PER_MESSAGE : 0;
  let chargeRef: string | null = null;
  if (price > 0) {
    try {
      chargeRef = await chargeForMessage(userId, price, sessionId);
    } catch (err) {
      await releaseQuestion(userId, reservation);
      throw err;
    }
  }

  // 4. Save the user message.
  let userMsg;
  try {
    userMsg = await ChatMessage.create({
      sessionId: session._id,
      userId: user._id,
      role: 'user',
      content: input.content,
      imageUrls: input.imageUrls ?? [],
      status: 'completed',
      charge: price,
    });
  } catch (err) {
    if (price > 0) await refundMessageCharge(userId, price, sessionId, chargeRef);
    await releaseQuestion(userId, reservation);
    throw err;
  }

  // 5. Call the AI, grounded in today's horoscope + the user's kundli (best-effort, cached per day).
  let reply;
  try {
    const [history, astro] = await Promise.all([loadHistory(session._id), getAstroContext(user, lang)]);
    reply = await generateReply({ system: buildSystemPrompt(user, lang, astro), messages: history });
  } catch (err) {
    // Roll back: no orphan user message, refund the charge, give the question back.
    await ChatMessage.deleteOne({ _id: userMsg._id }).catch((e: unknown) => logger.error({ err: e }, '[chat] rollback failed'));
    if (price > 0) await refundMessageCharge(userId, price, sessionId, chargeRef);
    await releaseQuestion(userId, reservation);
    if (err instanceof AiProviderError) throw new ApiError(502, 'chat.aiFailed');
    throw err;
  }

  // 6. Save the assistant message and update the session.
  const assistantMsg = await ChatMessage.create({
    sessionId: session._id,
    userId: user._id,
    role: 'assistant',
    content: reply.text,
    status: 'completed',
    model: reply.model,
    usage: reply.usage,
  });

  const update: Record<string, unknown> = {
    lastMessageAt: assistantMsg.createdAt,
    lastMessagePreview: reply.text.slice(0, PREVIEW_LENGTH),
  };
  if (!session.title) update.title = makeTitle(input.content);
  const [, quota] = await Promise.all([
    ChatSession.updateOne({ _id: session._id }, { $set: update, $inc: { messageCount: 2 } }),
    getQuota(userId),
  ]);

  return {
    userMessage: toPublicMessage(userMsg.toObject()),
    assistantMessage: toPublicMessage(assistantMsg.toObject()),
    quota,
  };
}
