import type { RawAxiosRequestHeaders } from "axios";
import { cookies, headers as requestHeaders } from "next/headers";
import { apiAccessToken, apiCookieHeader, parseApiCookies, stripApiTokenHeaders } from "@/utils/apiAuth";

type ActionContext = {
  headers?: RawAxiosRequestHeaders | Record<string, unknown>;
};

export async function buildActionHeaders(
  ctx: ActionContext,
  _token?: string,
): Promise<RawAxiosRequestHeaders> {
  // Keep the legacy argument for callers; only the request cookies establish
  // the API session. Browser storage may contain a separate chat session.
  const headers = Object.fromEntries(
    Object.entries(ctx?.headers ?? {}).map(([key, value]) => [key, String(value)]),
  ) as RawAxiosRequestHeaders;
  stripApiTokenHeaders(headers);
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === "cookie") delete headers[name];
  }
  const requestCookies = [
    ...(await cookies()).getAll(),
    ...parseApiCookies((await requestHeaders()).get("cookie")),
  ];
  const cookieHeader = apiCookieHeader(requestCookies);
  const accessToken = apiAccessToken(requestCookies);
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (cookieHeader) headers.Cookie = cookieHeader;
  return headers;
}
