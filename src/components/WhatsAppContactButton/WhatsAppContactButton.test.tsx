import { describe, it, expect } from "vitest";
import {
  extractPhoneNumber,
  buildWhatsAppUrl,
} from "./WhatsAppContactButton";

describe("extractPhoneNumber", () => {
  it("extrae teléfono directamente de phone o phone_number", () => {
    expect(extractPhoneNumber({ phone: "1122334455" })).toBe("1122334455");
    expect(extractPhoneNumber({ phone_number: "2619876543" })).toBe("2619876543");
  });

  it("extrae teléfono desde el objeto Profile anidado", () => {
    expect(
      extractPhoneNumber({
        Profile: { phone: "1155443322" },
      }),
    ).toBe("1155443322");
    expect(
      extractPhoneNumber({
        profile: { phone_number: "+54 9 11 4433 2211" },
      }),
    ).toBe("+54 9 11 4433 2211");
  });

  it("extrae teléfono desde el objeto Professional o Company anidado", () => {
    expect(
      extractPhoneNumber({
        Professional: { phone: "1133221100" },
      }),
    ).toBe("1133221100");
    expect(
      extractPhoneNumber({
        Company: { phone_number: "2615551234" },
      }),
    ).toBe("2615551234");
    expect(
      extractPhoneNumber({
        companies: [{ phone: "1199887766" }],
      }),
    ).toBe("1199887766");
  });

  it("retorna null si no hay teléfono", () => {
    expect(extractPhoneNumber(null)).toBeNull();
    expect(extractPhoneNumber({})).toBeNull();
  });
});

describe("buildWhatsAppUrl", () => {
  it("formatea correctamente números argentinos de 10 dígitos agregando 549", () => {
    const url = buildWhatsAppUrl("1122334455", "Hola, me interesa");
    expect(url).toContain("https://wa.me/5491122334455");
    expect(url).toContain("text=Hola%2C%20me%20interesa");
  });

  it("remueve el 0 inicial en números argentinos con código de área", () => {
    const url = buildWhatsAppUrl("01122334455");
    expect(url).toBe("https://wa.me/5491122334455");
  });

  it("maneja números que ya tienen código de país 54", () => {
    const url = buildWhatsAppUrl("+54 9 11 2233-4455");
    expect(url).toBe("https://wa.me/5491122334455");
  });
});
