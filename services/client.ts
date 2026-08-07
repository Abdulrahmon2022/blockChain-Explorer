import { ApiResponse } from "@/types";
import { reviveBigInts } from "@/lib/serialize";

/**
 * Shared fetch for every service. Talks to the route handlers under /api,
 * restores bigints, and turns failures into an `error` field rather than a
 * thrown exception — the UI already renders `ApiResponse.error`.
 */

function baseUrl(): string {
  // Relative URLs work in the browser but not during server rendering.
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function apiGet<T>(path: string, fallback: T): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${baseUrl()}${path}`, { cache: "no-store" });
    const body = await res.json();

    if (!res.ok || body.error) {
      return { data: fallback, error: body.error ?? `Request failed (${res.status})` };
    }

    return {
      data: reviveBigInts<T>(body.data),
      pagination: body.pagination,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { data: fallback, error: message };
  }
}

/** Builds a query string, dropping undefined values. */
export function query(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
