import { ApiResponse, Pagination } from "@/types";
import { toJson } from "./serialize";

/** Wraps data in the ApiResponse shape the services already expect. */
export function ok<T>(data: T, pagination?: Pagination): Response {
  const body: ApiResponse<T> = pagination ? { data, pagination } : { data };
  return Response.json(toJson(body));
}

export function fail(error: string, status = 400): Response {
  return Response.json({ data: null, error }, { status });
}

/**
 * Route handlers should never leak an RPC stack trace to the browser, but the
 * cause still needs to reach the terminal.
 */
export function handleError(error: unknown, context: string): Response {
  console.error(`[api] ${context}:`, error);
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ data: null, error: message }, { status: 502 });
}

export function paginate(page: number, pageSize: number, totalItems: number): Pagination {
  return {
    currentPage: page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

/** Reads a positive integer query param, falling back when absent or invalid. */
export function intParam(url: URL, name: string, fallback: number, max = 100): number {
  const raw = url.searchParams.get(name);
  if (!raw) return fallback;

  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}
