import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { idParam, objectId } from '../../utils/validators';

export const MAX_CONTENT_LENGTH = 4000;
export const MAX_IMAGES = 4;

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url('Must be a valid URL')
  .refine((v) => /^https?:\/\//i.test(v), { message: 'Only http(s) URLs are allowed' });

export const createSessionSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const listSessionsQuery = z.object({ ...paginationQuery });

/** `page`/`limit` (page 1 = newest messages) or `before=<messageId>` cursor. Items are always oldest -> newest. */
export const listMessagesQuery = z.object({
  ...paginationQuery,
  before: objectId.optional(),
});

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
    imageUrls: z.array(httpUrl).max(MAX_IMAGES).optional().default([]),
  })
  .strict();

export const sessionIdParam = idParam('id');

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuery>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
