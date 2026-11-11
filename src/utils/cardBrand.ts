export type CardBrand = "visa" | "mastercard" | "amex" | "cabal" | "maestro";

export function detectPaymentCardBrand(number: string, type = "credit"): CardBrand | null {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  // Match Cabal before the broader Maestro prefixes.
  if (/^(586057|589657|603522|604(?:20[1-9]|2[1-9]\d|3\d{2}|400)|627170)/.test(digits)) return "cabal";
  if (type === "debit" && /^(50|5[6-9]|6)/.test(digits)) return "maestro";
  return null;
}
