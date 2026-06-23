import type { RawAxiosRequestHeaders } from "axios";
import { cookies } from "next/headers";

type ActionContext = {
  headers?: RawAxiosRequestHeaders | Record<string, unknown>;
};

export async function buildActionHeaders(
  ctx: ActionContext,
  token?: string,
): Promise<RawAxiosRequestHeaders> {
  const rawHeaders = (ctx?.headers ?? {}) as Record<string, unknown>;
  const baseHeaders = Object.fromEntries(
    Object.entries(rawHeaders).map(([key, value]) => [key, String(value)]),
  ) as RawAxiosRequestHeaders;

  let finalToken = token;

  // Si no se proveyó un token explícitamente, o viene serializado como "$undefined" por Next.js
  if (!finalToken || finalToken === "$undefined" || finalToken === "undefined") {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get("access_token");
    if (accessCookie) {
      finalToken = accessCookie.value;
    } else {
      finalToken = undefined;
    }
  }

  if (!finalToken) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${finalToken}`,
  };
}
