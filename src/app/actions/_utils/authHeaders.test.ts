import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildActionHeaders } from "./authHeaders";

const { getAll, rawCookie } = vi.hoisted(() => ({ getAll: vi.fn(), rawCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll }), headers: async () => ({ get: rawCookie }) }));

const apiToken = `${btoa(JSON.stringify({ alg: "ES256" })).replace(/=+$/, "")}.${btoa(JSON.stringify({ iss: "https://api-project.supabase.co/auth/v1" })).replace(/=+$/, "")}.signature`;

describe("API action cookies", () => {
  beforeEach(() => { getAll.mockReturnValue([]); rawCookie.mockReturnValue(null); });

  it("preserves opaque cookies and their names without creating JWT headers", async () => {
    getAll.mockReturnValue([{ name: "token", value: "opaque-session" }, { name: "refresh_token", value: "opaque-refresh" }]);
    expect(await buildActionHeaders({ headers: { "x-api-key": "test" } })).toEqual({
      "x-api-key": "test", Cookie: "refresh_token=opaque-refresh",
    });
  });

  it("keeps the API Supabase JWT and excludes chat session cookies", async () => {
    getAll.mockReturnValue([
      { name: "token", value: "api-session" },
      { name: "access_token", value: apiToken },
      { name: "sb-project-auth-token.0", value: "base64-session" },
    ]);
    expect(await buildActionHeaders({})).toEqual({ Cookie: `access_token=${apiToken}`, Authorization: `Bearer ${apiToken}` });
  });

  it("recovers the JWT when framework cookies keep only a malformed duplicate", async () => {
    getAll.mockReturnValue([{ name: "access_token", value: "opaque-refresh" }]);
    rawCookie.mockReturnValue(`access_token=${apiToken}; access_token=opaque-refresh`);
    expect(await buildActionHeaders({})).toEqual({
      Cookie: `access_token=${apiToken}`, Authorization: `Bearer ${apiToken}`,
    });
  });

  it("removes stale auth headers and ignores client token fallbacks", async () => {
    expect(await buildActionHeaders({ headers: {
      authorization: "Bearer undefined", "X-Token": "stale", token: "stale",
      "x-access-token": "stale", cookie: "token=stale",
    } }, apiToken)).toEqual({});
  });
});
