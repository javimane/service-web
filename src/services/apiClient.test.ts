import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isSupabaseToken } from "./apiClient";

describe("apiClient - token handling and separation", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000");
    // Clear localStorage and document.cookie
    localStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  });

  it("identifies Supabase tokens correctly", () => {
    // Header with alg: ES256 and kid
    const header = btoa(JSON.stringify({ alg: "ES256", kid: "4239062d-d8be-494d-b130-03775f55960c", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ iss: "https://nrxfzwcsrqgwfraqxckp.supabase.co/auth/v1", sub: "123" }));
    const supabaseToken = `${header}.${payload}.signature`;

    expect(isSupabaseToken(supabaseToken)).toBe(true);

    // Standard NestJS token (HS256 or RS256, no supabase iss)
    const nestHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const nestPayload = btoa(JSON.stringify({ sub: "user-123", email: "user@example.com" }));
    const nestToken = `${nestHeader}.${nestPayload}.signature`;

    expect(isSupabaseToken(nestToken)).toBe(false);
    expect(isSupabaseToken(undefined)).toBe(false);
    expect(isSupabaseToken("not-a-token")).toBe(false);
  });

  it("strips authorization headers on public auth endpoints", async () => {
    const { default: axiosInstance } = await import("./apiClient");
    localStorage.setItem("token", "valid-nest-token");

    // Simular llamada al interceptor de request
    const interceptor = (axiosInstance.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor({
      url: "http://localhost:3000/api/auth/sync-oauth",
      headers: {
        Authorization: "Bearer existing",
        token: "existing",
      },
    });

    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers.token).toBeUndefined();
  });

  it("uses cookies without promoting opaque API tokens to JWT headers", async () => {
    const { default: axiosInstance } = await import("./apiClient");
    const nestToken = "valid-nest-token-123";
    localStorage.setItem("token", "stale-token");
    document.cookie = `token=${nestToken}; path=/`;

    const interceptor = (axiosInstance.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor({
      url: "http://localhost:3000/api/logistics/employees",
      headers: {},
    });

    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers.token).toBeUndefined();
    expect(config.headers["x-token"]).toBeUndefined();
    expect(document.cookie).toContain(`token=${nestToken}`);
    expect(document.cookie).not.toContain("access_token=");
    expect(axiosInstance.defaults.withCredentials).toBe(true);
    expect(config.url).toBe("/api/backend/logistics/employees");
  });

  it("does not read or attach Supabase sb-* token", async () => {
    const { default: axiosInstance } = await import("./apiClient");
    const header = btoa(JSON.stringify({ alg: "ES256", kid: "4239062d-d8be-494d-b130-03775f55960c", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ iss: "https://nrxfzwcsrqgwfraqxckp.supabase.co/auth/v1", sub: "123" }));
    const supabaseToken = `${header}.${payload}.signature`;

    localStorage.setItem("sb-nrxfzwcsrqgwfraqxckp-auth-token", JSON.stringify({ access_token: supabaseToken }));

    const interceptor = (axiosInstance.interceptors.request as any).handlers[0].fulfilled;
    const config = await interceptor({
      url: "http://localhost:3000/api/orders/merchant?page=1&limit=10",
      headers: {},
    });

    expect(config.headers.Authorization).toBeUndefined();
    expect(config.headers.token).toBeUndefined();
  });

  it("getAccessToken ignores legacy token cookies and browser storage", async () => {
    const { getAccessToken } = await import("../utils/auth");

    // When only Supabase token is in localStorage under sb-* key
    const header = btoa(JSON.stringify({ alg: "ES256", kid: "4239062d-d8be-494d-b130-03775f55960c", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ iss: "https://project.supabase.co/auth/v1", sub: "123" }));
    const supabaseToken = `${header}.${payload}.signature`;
    localStorage.setItem("sb-test-auth-token", JSON.stringify({ access_token: supabaseToken }));

    expect(getAccessToken()).toBeUndefined();

    // When NestJS token is present in cookie
    document.cookie = "token=valid-nest-cookie; path=/";
    expect(getAccessToken()).toBeUndefined();

    // When NestJS token is in localStorage
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    localStorage.setItem("token", "valid-nest-local");
    expect(getAccessToken()).toBeUndefined();
  });
  it("refreshes using cookies without saving the returned chat token", async () => {
    const { default: axios } = await import("axios");
    const { default: client } = await import("./apiClient");
    const chatToken = `${btoa(JSON.stringify({ alg: "ES256" }))}.${btoa(JSON.stringify({ iss: "https://chat.supabase.co/auth/v1" }))}.signature`;
    document.cookie = "token=opaque-session; path=/";
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { session: { access_token: chatToken } }, headers: {},
    });
    const responseInterceptor = (client.interceptors.response as any).handlers[0].rejected;
    const result = await responseInterceptor({
      response: { status: 401 },
      config: {
        url: "http://localhost:3000/api/orders",
        headers: { Authorization: "Bearer stale", "x-token": "stale" },
        adapter: async (config: any) => {
          expect(config.headers.Authorization).toBeUndefined();
          expect(config.headers["x-token"]).toBeUndefined();
          return { data: "ok", status: 200, statusText: "OK", headers: {}, config };
        },
      },
    });
    expect(result.data).toBe("ok");
    expect(document.cookie).toBe("token=opaque-session");
    expect(localStorage.getItem("access_token")).toBeNull();
  });

});
