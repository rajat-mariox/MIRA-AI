import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Zod fragment to spread into query schemas: `z.object({ ...paginationQuery, search: z.string().optional() })`. */
export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
};

/** Parse `page` / `limit` from a query object (clamped: page>=1, 1<=limit<=100). */
export function parsePagination(
  query: Record<string, unknown> | undefined,
  defaultLimit: number = DEFAULT_LIMIT,
): PaginationParams {
  const rawPage = Number(query?.page);
  const rawLimit = Number(query?.limit);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(Math.floor(rawLimit), MAX_LIMIT) : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the standard paginated payload: `{ items, pagination: { page, limit, total, totalPages } }`. */
export function buildPaginated<T>(items: T[], total: number, params: Pick<PaginationParams, 'page' | 'limit'>): Paginated<T> {
  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: params.limit > 0 ? Math.ceil(total / params.limit) : 0,
    },
  };
}

/**
 * One-liner for Mongoose models:
 *   const result = await paginate(Banner, { isActive: true }, req.query, { sort: { createdAt: -1 } });
 */
export async function paginate<T>(
  model: {
    find: (filter: any) => any;
    countDocuments: (filter: any) => any;
  },
  filter: Record<string, unknown>,
  query: Record<string, unknown> | undefined,
  opts: { sort?: Record<string, 1 | -1>; select?: string; populate?: any; lean?: boolean; defaultLimit?: number } = {},
): Promise<Paginated<T>> {
  const p = parsePagination(query, opts.defaultLimit);
  let q = model.find(filter).sort(opts.sort ?? { createdAt: -1 }).skip(p.skip).limit(p.limit);
  if (opts.select) q = q.select(opts.select);
  if (opts.populate) q = q.populate(opts.populate);
  if (opts.lean !== false) q = q.lean();
  const [items, total] = await Promise.all([q.exec(), model.countDocuments(filter).exec()]);
  return buildPaginated<T>(items as T[], total as number, p);
}
