/** Classification only; JWT signatures are verified by the receiving service. */
export function isSupabaseToken(token?: string | null): boolean {
  if (!token) return false;
  try {
    const parts = decodeURIComponent(token).split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.iss !== "string") return false;
    const issuer = new URL(payload.iss);
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return issuer.pathname === "/auth/v1" && (
      issuer.hostname.endsWith(".supabase.co") ||
      issuer.hostname.endsWith(".supabase.in") ||
      Boolean(configured && issuer.origin === new URL(configured).origin)
    );
  } catch {
    return false;
  }
}

export function stripApiTokenHeaders(headers: Record<string, unknown>): void {
  for (const name of Object.keys(headers)) {
    if (["authorization", "token", "x-token", "x-access-token"].includes(name.toLowerCase())) {
      delete headers[name];
    }
  }
}

type ApiCookie = { name: string; value: string };

/** Preserve duplicate cookie names: frameworks may otherwise keep a stale value. */
export function parseApiCookies(header: string | null): ApiCookie[] {
  return (header || "").split(";").flatMap((pair) => {
    const separator = pair.indexOf("=");
    if (separator < 1) return [];
    return [{ name: pair.slice(0, separator).trim(), value: pair.slice(separator + 1).trim() }];
  });
}

export function apiAccessToken(cookies: ApiCookie[]): string | undefined {
  for (const { name, value } of cookies) {
    if (name !== "access_token") continue;
    try {
      const token = decodeURIComponent(value);
      // Structural check only. The API validates the signature and issuer.
      if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return token;
    } catch {
      // A malformed/legacy cookie must not hide another valid access cookie.
    }
  }
  return undefined;
}

export function apiCookieHeader(cookies: ApiCookie[]): string {
  const result: string[] = [];
  const accessToken = apiAccessToken(cookies);
  if (accessToken) result.push(`access_token=${accessToken}`);
  const refresh = cookies.find(({ name, value }) => name === "refresh_token" && value);
  if (refresh) result.push(`refresh_token=${refresh.value}`);
  // Use the same selected JWT for Cookie and Bearer. Never forward malformed
  // access cookies: AuthGuard would still consume them via its cookie fallback.
  return result.join("; ");
}

export function browserApiUrl(url: string): string {
  if (url.startsWith("/api/backend/")) return url;
  const base = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000");
  const target = new URL(url, base);
  const apiPrefix = `${base.pathname.replace(/\/$/, "")}/api/`;
  if (target.origin !== base.origin || !target.pathname.startsWith(apiPrefix)) return url;
  return `/api/backend/${target.pathname.slice(apiPrefix.length)}${target.search}`;
}
