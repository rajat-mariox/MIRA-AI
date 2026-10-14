import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const CHAT_ROLES = ['user', 'assistant'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

/** 'completed' = normal message. ('pending' / 'failed' reserved for streaming / async replies.) */
export const CHAT_MESSAGE_STATUSES = ['pending', 'completed', 'failed'] as const;

const chatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** null until set by the user or auto-titled from the first user message. */
    title: { type: String, trim: true, default: null },
    lastMessageAt: { type: Date, default: () => new Date() },
    lastMessagePreview: { type: String, default: null },
    messageCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

const chatMessageSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: CHAT_ROLES, required: true },
    content: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
    status: { type: String, enum: CHAT_MESSAGE_STATUSES, default: 'completed' },
    /** AI model that produced an assistant message. */
    model: { type: String, default: null },
    usage: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
    },
    /** Wallet amount charged for this exchange (on the user message). */
    charge: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);
chatMessageSchema.index({ sessionId: 1, createdAt: -1, _id: -1 });

export type ChatSessionAttrs = InferSchemaType<typeof chatSessionSchema>;
export type ChatMessageAttrs = InferSchemaType<typeof chatMessageSchema>;
export const ChatSession = model('ChatSession', chatSessionSchema);
export const ChatMessage = model('ChatMessage', chatMessageSchema);

type WithMeta<T> = T & { _id: Types.ObjectId | string; createdAt?: Date; updatedAt?: Date };

export interface PublicChatSession {
  id: string;
  _id: string;
  title: string | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  messageCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface PublicChatMessage {
  id: string;
  _id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  /** Same as `content` (the app's MessageBubble reads `text`). */
  text: string;
  imageUrls: string[];
  status: string;
  model: string | null;
  usage: { inputTokens: number; outputTokens: number } | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function toPublicSession(s: WithMeta<ChatSessionAttrs>): PublicChatSession {
  const id = String(s._id);
  return {
    id,
    _id: id,
    title: s.title ?? null,
    lastMessageAt: s.lastMessageAt ?? null,
    lastMessagePreview: s.lastMessagePreview ?? null,
    messageCount: s.messageCount ?? 0,
    createdAt: s.createdAt ?? null,
    updatedAt: s.updatedAt ?? null,
  };
}

export function toPublicMessage(m: WithMeta<ChatMessageAttrs>): PublicChatMessage {
  const id = String(m._id);
  return {
    id,
    _id: id,
    sessionId: String(m.sessionId),
    role: m.role as ChatRole,
    content: m.content,
    text: m.content,
    imageUrls: m.imageUrls ?? [],
    status: m.status ?? 'completed',
    model: m.model ?? null,
    usage:
      m.role === 'assistant' && m.usage
        ? { inputTokens: m.usage.inputTokens ?? 0, outputTokens: m.usage.outputTokens ?? 0 }
        : null,
    createdAt: m.createdAt ?? null,
    updatedAt: m.updatedAt ?? null,
  };
}
