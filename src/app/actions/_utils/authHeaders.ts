import type { RawAxiosRequestHeaders } from "axios";

type ActionContext = {
  headers?: RawAxiosRequestHeaders | Record<string, unknown>;
};

export function buildActionHeaders(
  ctx: ActionContext,
  token?: string,
): RawAxiosRequestHeaders {
  const rawHeaders = (ctx?.headers ?? {}) as Record<string, unknown>;
  const baseHeaders = Object.fromEntries(
    Object.entries(rawHeaders).map(([key, value]) => [key, String(value)]),
  ) as RawAxiosRequestHeaders;

  if (!token) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}
