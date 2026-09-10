import { env } from "./env";

export function getApiKey(): string {
  return (
    process.env.WEB_API_KEY ||
    env?.WEB_API_KEY ||
    process.env.NEXT_PUBLIC_WEB_API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY ||
    ""
  );
}

export function getApiHeaders(customHeaders?: HeadersInit): Headers {
  const apiKey = getApiKey();
  const headers = new Headers(customHeaders);
  if (apiKey && !headers.has("x-api-key")) {
    headers.set("x-api-key", apiKey);
  }
  return headers;
}

export async function fetchWithApiKey(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = getApiHeaders(init?.headers);
  return fetch(url, {
    ...init,
    headers,
  });
}
