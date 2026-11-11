// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { browserApiUrl } from "@/utils/apiAuth";

const apiToken = `${Buffer.from(JSON.stringify({ alg: "ES256" })).toString("base64url")}.${Buffer.from(JSON.stringify({ iss: "https://api-project.supabase.co/auth/v1" })).toString("base64url")}.signature`;
const upstreamFetch = vi.fn();
const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("HttpOnly API proxy", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    vi.stubEnv("WEB_API_KEY", "test-api-key");
    vi.stubGlobal("fetch", upstreamFetch);
    upstreamFetch.mockReset();
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it.each(["orders", "logistics", "scoring", "users"])("sends access_token as Bearer for %s, never the opaque refresh token", async (path) => {
    upstreamFetch.mockResolvedValue(Response.json({ ok: true }));
    const response = await GET(new NextRequest(`https://web.example.com/api/backend/${path}?page=2`, {
      headers: { cookie: `access_token=${apiToken}; refresh_token=opaque-refresh; token=old-refresh; sb-chat-auth-token=chat-session`, authorization: "Bearer injected" },
    }), context([path]));
    const [url, options] = upstreamFetch.mock.calls[0];
    expect(url.toString()).toBe(`https://api.example.com/api/${path}?page=2`);
    expect(options.headers.get("authorization")).toBe(`Bearer ${apiToken}`);
    expect(options.headers.get("cookie")).toBe(`access_token=${apiToken}; refresh_token=opaque-refresh`);
    expect(options.headers.get("x-api-key")).toBe("test-api-key");
    expect(await response.json()).toEqual({ ok: true });
  });

  it.each(["login", "refresh"])("relays %s cookies with HttpOnly and expiry intact", async (action) => {
    const headers = new Headers();
    headers.append("set-cookie", `access_token=${apiToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=api.example.com; Max-Age=3600`);
    headers.append("set-cookie", "refresh_token=rotated; Path=/; HttpOnly; Secure; SameSite=Lax");
    upstreamFetch.mockResolvedValue(Response.json({ ok: true }, { headers }));
    const response = await POST(new NextRequest(`https://web.example.com/api/backend/auth/${action}`, {
      method: "POST", headers: { origin: "https://web.example.com", "content-type": "application/json" }, body: "{}",
    }), context(["auth", action]));
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("Max-Age=3600");
    expect(cookies[0]).not.toContain("Domain=");
    expect(cookies[1]).toContain("refresh_token=rotated");
  });

  it("never converts a malformed access cookie or refresh cookie into Bearer", async () => {
    upstreamFetch.mockResolvedValue(Response.json({ message: "Missing token" }, { status: 401 }));
    const response = await GET(new NextRequest("https://web.example.com/api/backend/users", {
      headers: { cookie: "access_token=opaque; refresh_token=opaque-refresh" },
    }), context(["users"]));
    expect(upstreamFetch.mock.calls[0][1].headers.has("authorization")).toBe(false);
    expect(response.status).toBe(401);
  });

  it("does not send a malformed access token through the cookie fallback", async () => {
    upstreamFetch.mockResolvedValue(Response.json({ message: "Missing token" }, { status: 401 }));
    await GET(new NextRequest("https://web.example.com/api/backend/orders", {
      headers: { cookie: "access_token=opaque-server-token; refresh_token=opaque-refresh" },
    }), context(["orders"]));
    const sentHeaders = upstreamFetch.mock.calls[0][1].headers;
    // AuthGuard falls back to access_token when Authorization is absent.
    expect(sentHeaders.get("authorization")).toBeNull();
    expect(sentHeaders.get("cookie")).toBe("refresh_token=opaque-refresh");
    expect(upstreamFetch).toHaveBeenCalledOnce();
  });

  it.each([true, false])("finds the JWT among duplicate access cookies (valid first: %s)", async (validFirst) => {
    upstreamFetch.mockResolvedValue(Response.json({ ok: true }));
    const values = validFirst ? [apiToken, "opaque-stale"] : ["opaque-stale", apiToken];
    await GET(new NextRequest("https://web.example.com/api/backend/orders", {
      headers: { cookie: values.map((value) => `access_token=${value}`).join("; ") },
    }), context(["orders"]));
    const headers = upstreamFetch.mock.calls[0][1].headers;
    expect(headers.get("authorization")).toBe(`Bearer ${apiToken}`);
    expect(headers.get("cookie")).toBe(`access_token=${apiToken}`);
  });

  it("rejects cross-origin mutations before sending credentials", async () => {
    const response = await POST(new NextRequest("https://web.example.com/api/backend/orders", {
      method: "POST", headers: { origin: "https://other.example.com" }, body: "{}",
    }), context(["orders"]));
    expect(response.status).toBe(403);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("maps only API URLs and leaves retry URLs unchanged", () => {
    expect(browserApiUrl("https://api.example.com/api/orders?page=1")).toBe("/api/backend/orders?page=1");
    expect(browserApiUrl("/api/backend/orders?page=1")).toBe("/api/backend/orders?page=1");
    expect(browserApiUrl("https://chat.supabase.co/auth/v1")).toBe("https://chat.supabase.co/auth/v1");
  });
});
