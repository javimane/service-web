import { apiAccessToken } from "./apiAuth";

export function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  // Normally HttpOnly: server actions and the API proxy read this cookie.
  // Never use server_token, token, or the chat's localStorage session.
  return apiAccessToken(document.cookie.split(";").map((pair) => {
    const separator = pair.indexOf("=");
    return { name: pair.slice(0, separator).trim(), value: pair.slice(separator + 1) };
  }));
}
