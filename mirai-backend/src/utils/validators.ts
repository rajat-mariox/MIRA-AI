import { Types } from 'mongoose';
import { z } from 'zod';

/** Shared zod building blocks for module validation files. */

export const objectId = z
  .string()
  .trim()
  .refine((v) => Types.ObjectId.isValid(v) && /^[a-f\d]{24}$/i.test(v), { message: 'Invalid id' });

export const email = z.string().trim().toLowerCase().email('Invalid email address').max(254);

/** "HH:mm" 24-hour time. */
export const time24h = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be in HH:mm 24-hour format');

/** ISO-8601 datetime string -> Date. Also accepts date-only "YYYY-MM-DD". */
export const isoDate = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v) && !Number.isNaN(Date.parse(v)), {
    message: 'Must be an ISO-8601 date/datetime',
  })
  .transform((v) => new Date(v));

/** Params schema for routes like `/:id`. */
export const idParam = (name = 'id') => z.object({ [name]: objectId });
