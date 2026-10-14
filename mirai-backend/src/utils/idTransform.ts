import type { Schema } from 'mongoose';

/**
 * Makes `doc.toJSON()` / `res.json(doc)` emit BOTH `_id` and `id` (string), without `__v`.
 * The admin panel reads `id` for some resources and `_id` for others, so we always send both.
 *
 *   const schema = new Schema({...}, { timestamps: true, versionKey: false });
 *   withIdJSON(schema);
 *
 * Note: `.lean()` results bypass this; use `toIdJSON(leanDoc)` for those.
 */
export function withIdJSON(schema: Schema): Schema {
  const transform = (_doc: unknown, ret: Record<string, unknown>) => {
    if (ret._id !== undefined && ret._id !== null) {
      ret._id = String(ret._id);
      ret.id = ret._id;
    }
    delete ret.__v;
    return ret;
  };
  schema.set('toJSON', { virtuals: false, versionKey: false, transform });
  return schema;
}

/** Same as the toJSON transform, for plain (lean) objects. */
export function toIdJSON<T extends { _id?: unknown }>(obj: T): T & { _id: string; id: string } {
  const { __v: _v, ...rest } = obj as T & { __v?: unknown };
  const id = String(obj._id);
  return { ...(rest as T), _id: id, id };
}

/** Escape user input for use inside a RegExp (search filters). */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
