/**
 * Schema `toJSON` / `toObject` options that emit BOTH `_id` and `id` (string) and drop `__v`.
 * The admin panel reads `id` for some resources (banners, plans) and `_id` for others (faq, cms),
 * so documents sent to clients should carry both.
 *
 *   new Schema({...}, { timestamps: true, versionKey: false, toJSON: withIdJson(), toObject: withIdJson() });
 *   new Schema({...}, { toJSON: withIdJson(['passwordHash']) });   // also strip secret fields
 *
 * Note: only applies to hydrated documents (not `.lean()` results). For lean objects use `withId()`.
 */
export function withIdJson(hidden: string[] = []) {
  return {
    virtuals: true,
    versionKey: false,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      if (ret._id !== undefined) {
        ret._id = String(ret._id);
        ret.id = ret._id;
      }
      delete ret.__v;
      for (const key of hidden) delete ret[key];
      return ret;
    },
  };
}

/** Adds string `id` + `_id` to a lean object. */
export function withId<T extends { _id?: unknown }>(obj: T): T & { _id: string; id: string } {
  const id = String(obj._id);
  return { ...obj, _id: id, id };
}
