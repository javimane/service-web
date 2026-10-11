import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requestMock } = vi.hoisted(() => ({ requestMock: vi.fn() }));
vi.mock("node:https", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:https")>();
  return {
    ...actual,
    default: { ...actual, request: requestMock },
    request: requestMock,
  };
});

import { POST } from "./route";

const url = "http://localhost:3001/api/payments/payway/token";
const card = {
  card_number: "4507990000004905",
  card_expiration_month: "12",
  card_expiration_year: "30",
  security_code: "123",
  card_holder_name: "José Pérez",
  card_holder_identification: { type: "dni", number: "12345678" },
  fraud_detection: { device_unique_identifier: 'collected-session' },
};

function tokenRequest(origin = "http://localhost:3001") {
  return new NextRequest(url, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(card),
  });
}

describe("Payway token route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-test-key");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "sandbox");
    requestMock.mockImplementation((_url, _options, onResponse) => {
      const request = new EventEmitter() as EventEmitter & {
        setTimeout: ReturnType<typeof vi.fn>;
        end: ReturnType<typeof vi.fn>;
      };
      request.setTimeout = vi.fn();
      request.end = vi.fn(() => {
        queueMicrotask(() => {
          const response = new EventEmitter() as EventEmitter & { statusCode: number };
          response.statusCode = 201;
          onResponse(response);
          response.emit("data", Buffer.from(JSON.stringify({
            id: "one-use-token",
            bin: "450799",
            card_number: card.card_number,
          })));
          response.emit("end");
        });
      });
      return request;
    });
  });

  afterEach(() => {
    requestMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("forwards the card only to Payway and returns a minimal uncached token response", async () => {
    const response = await POST(tokenRequest());

    expect(response.status).toBe(200);
    expect(requestMock.mock.calls[0][0]).toBe("https://developers-ventasonline.payway.com.ar/api/v2/tokens");
    expect(requestMock.mock.calls[0][1].headers.apikey).toBe("public-test-key");
    const upstreamRequest = requestMock.mock.results[0].value;
    expect(JSON.parse(upstreamRequest.end.mock.calls[0][0]).fraud_detection)
      .toEqual({ device_unique_identifier: 'collected-session' });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ id: "one-use-token", bin: "450799" });
  });

  it("rejects a cross-origin request before forwarding card details", async () => {
    const response = await POST(tokenRequest("https://otro-sitio.example"));
    expect(response.status).toBe(403);
    expect(requestMock).not.toHaveBeenCalled();
  });
  it('rejects tokenization without a collected fingerprint before calling Payway', async () => {
    const { fraud_detection: _, ...withoutFingerprint } = card;
    const response = await POST(new NextRequest(url, { method: 'POST',
      headers: { origin: 'http://localhost:3001', 'content-type': 'application/json' },
      body: JSON.stringify(withoutFingerprint) }));
    expect(response.status).toBe(400);
    expect(requestMock).not.toHaveBeenCalled();
  });
  it('preserves the collected device session when tokenizing a saved card', async () => {
    const response = await POST(new NextRequest(url, { method: 'POST',
      headers: { origin: 'http://localhost:3001', 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'vault-token', security_code: '123', fraud_detection: card.fraud_detection }) }));
    expect(response.status).toBe(200);
    expect(JSON.parse(requestMock.mock.results[0].value.end.mock.calls[0][0])).toEqual({
      token: 'vault-token', security_code: '123', fraud_detection: card.fraud_detection,
    });
  });
});
