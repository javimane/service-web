import { describe, expect, it } from "vitest";
import { isQrPaymentConfirmed } from "./useQrPaymentStatus";

describe("isQrPaymentConfirmed", () => {
  it("espera la confirmación real del pago", () => {
    expect(isQrPaymentConfirmed("pending_payment")).toBe(false);
    expect(isQrPaymentConfirmed("pending")).toBe(false);
    expect(isQrPaymentConfirmed("paid")).toBe(true);
    expect(isQrPaymentConfirmed("confirmed")).toBe(true);
    expect(isQrPaymentConfirmed("cancelled")).toBe(false);
    expect(isQrPaymentConfirmed("refunded")).toBe(false);
  });
});
