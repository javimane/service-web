import { describe, expect, it } from "vitest";
import { normalizeReturnReceiptCode } from "./returnReceiptCode";

describe("código del comprobante de devolución", () => {
  it("acepta el código corto que genera el ticket", () => {
    expect(normalizeReturnReceiptCode(" 74cd3fc036 ")).toBe("74CD3FC036");
  });

  it("mantiene compatibilidad con el identificador de reclamos anteriores", () => {
    expect(normalizeReturnReceiptCode("a1ce3871-77f0-49fb-94b9-c2f86f9168af"))
      .toBe("A1CE3871-77F0-49FB-94B9-C2F86F9168AF");
  });

  it("rechaza lecturas que no son códigos completos", () => {
    expect(normalizeReturnReceiptCode("pedido-74CD3FC036")).toBeNull();
    expect(normalizeReturnReceiptCode("74CD3FC03")).toBeNull();
  });
});
