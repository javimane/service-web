import { afterEach, describe, expect, it, vi } from "vitest";
import { tokenizePayway, paywayMethodId } from "./cardPayments";
import { apiClient } from "./apiClient";
import { collectPaywayDeviceFingerprint } from './paywayDeviceFingerprint';

vi.mock("./apiClient", () => ({ apiClient: vi.fn() }));
vi.mock('./paywayDeviceFingerprint', () => ({ collectPaywayDeviceFingerprint: vi.fn(async () => 'collected-session') }));
describe("Payway tokenization", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.mocked(apiClient).mockReset(); });
  const config = {
    provider: "payway" as const,
    environment: "sandbox" as const,
    device_fingerprint: { organization_id: 'test-org', merchant_id: 'test-merchant' },
    payment_methods: [
      { id: 1, brand: 'visa', name: 'Visa', type: 'credit' as const },
      { id: 104, brand: 'mastercard', name: 'Mastercard Payway', type: 'credit' as const },
      { id: 105, brand: 'mastercard', name: 'Mastercard Débito Payway', type: 'debit' as const },
    ],
  };
  const input = {
    number: "4507990000004905",
    holder: "José Pérez",
    dni: "12345678",
    expiry: "12/30",
    cvv: "123",
  };

  it("sends card details to the same-origin token endpoint and returns only the payment token", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-from-env");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "sandbox");
    const mock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: "one-use-token", bin: "450799" }),
      });
    vi.stubGlobal("fetch", mock);
    const result = await tokenizePayway(config, input);
    expect(apiClient).toHaveBeenCalledWith(
      expect.stringContaining("/api/identity-verification/me/cardholder-check"),
      { method: "POST", body: { card_holder_name: input.holder, card_holder_dni: input.dni } },
    );
    expect(mock.mock.calls[0][0]).toBe("/api/payments/payway/token");
    expect(mock.mock.calls[0][1].headers).not.toHaveProperty("apikey");
    expect(mock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(mock.mock.calls[0][1].body).fraud_detection).toEqual({ device_unique_identifier: 'collected-session' });
    expect(result.card_token).toBe("one-use-token");
    expect(result.payway_device_fingerprint_id).toBe('collected-session');
    expect(collectPaywayDeviceFingerprint).toHaveBeenCalledWith(config.device_fingerprint);
    expect(JSON.stringify(result)).not.toContain(input.number);
    expect(result).not.toHaveProperty("cvv");
  });

  it("generates a fresh payment token from a saved Payway token and requires CVV", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-from-env");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "sandbox");
    const mock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: "new-payment-token" }),
      });
    vi.stubGlobal("fetch", mock);
    const saved = {
      id: "saved-1",
      provider: "payway",
      provider_card_token: "vault-token",
      payway_payment_method_id: 1,
      card_bin: "450799",
    };
    const result = await tokenizePayway(config, input, saved);
    expect(apiClient).not.toHaveBeenCalled();
    expect(JSON.parse(mock.mock.calls[0][1].body)).toEqual({
      token: "vault-token",
      security_code: "123",
      fraud_detection: { device_unique_identifier: 'collected-session' },
    });
    expect(result.saved_payment_method_id).toBe("saved-1");
    await expect(
      tokenizePayway(config, { ...input, cvv: "" }, saved),
    ).rejects.toThrow("código");
  });

  it("does not send card details to Payway when the verified identity does not match", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-from-env");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "sandbox");
    vi.mocked(apiClient).mockRejectedValueOnce(new Error("El DNI no coincide"));
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    await expect(tokenizePayway(config, input)).rejects.toThrow("El DNI no coincide");
    expect(request).not.toHaveBeenCalled();
  });

  it("shows a useful connection error instead of the browser's Failed to fetch", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-from-env");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "sandbox");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(tokenizePayway(config, input)).rejects.toThrow("servidor de pagos");
  });

  it("rejects a browser environment that differs from the API environment", async () => {
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_PUBLIC_KEY", "public-from-env");
    vi.stubEnv("NEXT_PUBLIC_PAYWAY_ENVIRONMENT", "production");
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    await expect(tokenizePayway(config, input)).rejects.toThrow("no coincide");
    expect(mock).not.toHaveBeenCalled();
  });

  it('uses Gateway payment methods supplied by the API instead of the legacy Mastercard IDs', () => {
    expect(paywayMethodId('5454540000000000', 'credit', config.payment_methods)).toBe(104);
    expect(paywayMethodId('5454540000000000', 'debit', config.payment_methods)).toBe(105);
    expect(() => paywayMethodId('5454540000000000', 'credit')).toThrow('Actualizá');
  });

  it('uses the same-origin token endpoint in production', async () => {
    vi.stubEnv('NEXT_PUBLIC_PAYWAY_PUBLIC_KEY', 'public');
    vi.stubEnv('NEXT_PUBLIC_PAYWAY_ENVIRONMENT', 'production');
    const mock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'token' }) });
    vi.stubGlobal('fetch', mock);
    await tokenizePayway({ ...config, environment: 'production' }, input);
    expect(mock.mock.calls[0][0]).toBe('/api/payments/payway/token');
  });
});
