export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  items: T[];       // the page slice (use the original array key name in each handler, not "items")
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Parse and validate ?limit and ?offset from query string
// Returns 400-compatible error string or valid params
export function parsePagination(query: Record<string, unknown>): { params: PaginationParams } | { error: string } {
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  let limit = 20;
  let offset = 0;

  if (rawLimit !== undefined) {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1) return { error: '?limit must be a positive integer' };
    if (n > 100) return { error: '?limit cannot exceed 100' };
    limit = n;
  }

  if (rawOffset !== undefined) {
    const n = Number(rawOffset);
    if (!Number.isInteger(n) || n < 0) return { error: '?offset must be a non-negative integer' };
    offset = n;
  }

  return { params: { limit, offset } };
}

// Slice an array with pagination, return envelope fields
export function applyPagination<T>(arr: T[], params: PaginationParams): { page: T[]; total: number; limit: number; offset: number; has_more: boolean } {
  const total = arr.length;
  const page = arr.slice(params.offset, params.offset + params.limit);
  return { page, total, limit: params.limit, offset: params.offset, has_more: params.offset + params.limit < total };
}
