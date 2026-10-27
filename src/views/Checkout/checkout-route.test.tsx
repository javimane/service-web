import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/app/pagar/[kind]/[id]/page";

const mocks = vi.hoisted(() => ({ requestCookies: [] as Array<{ name: string; value: string }>, fetch: vi.fn(), redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => mocks.requestCookies }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { mocks.redirect(url); throw new Error("REDIRECT"); },
  notFound: () => { throw new Error("NOT_FOUND"); },
}));
vi.mock("@/lib/serverFetch", () => ({ fetchWithApiKey: mocks.fetch }));
vi.mock("@/views/Checkout/CheckoutPage", () => ({ default: () => null }));
vi.mock("@/views/Checkout/CheckoutAccess", () => ({ default: () => null }));
const id = "042fcecf-8fda-42ce-8ff9-04d729c6f843";

describe("checkout page route", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.requestCookies = []; });
  it.each(["producto", "servicio"])("redirects a cookie-less %s request before loading checkout data", async (kind) => {
    await expect(Page({ params: Promise.resolve({ kind, id }), searchParams: Promise.resolve({ quantity: "3" }) })).rejects.toThrow("REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent(`/pagar/${kind}/${id}?quantity=3`)}`);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("does not treat a chat cookie as a purchase session", async () => {
    mocks.requestCookies = [{ name: "server_token", value: "chat-token" }];
    await expect(Page({ params: Promise.resolve({ kind: "producto", id }), searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("keeps the client session guard around requests with a refresh cookie", async () => {
    mocks.requestCookies = [{ name: "refresh_token", value: "refresh-cookie" }];
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id }) });
    const page = await Page({ params: Promise.resolve({ kind: "producto", id }), searchParams: Promise.resolve({ quantity: "2" }) });
    expect(page.props.returnTo).toBe(`/pagar/producto/${id}?quantity=2`);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
