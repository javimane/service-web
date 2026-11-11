import { isUuid } from "./utils";

export function checkoutLoginUrl(returnTo: string): string {
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
}

/** Only checkout routes within this site can be used as a post-login destination. */
export function checkoutReturnPath(search: string): string | null {
  const candidate = new URLSearchParams(search).get("redirect");
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return null;
  try {
    const url = new URL(candidate, "https://sercio.invalid");
    const match = /^\/pagar\/(producto|servicio)\/([^/]+)$/.exec(url.pathname);
    if (!match || !isUuid(match[2])) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
