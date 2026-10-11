import { apiClient } from "./apiClient";
import { API_BASE_URL } from "./api.config";
import { collectPaywayDeviceFingerprint } from './paywayDeviceFingerprint';

export type CardConfig = {
  provider: "getnet" | "payway";
  environment?: "sandbox" | "production";
  available_installments?: number[];
  payment_methods?: PaywayPaymentMethod[];
  financing_rates?: Array<{ installments: number; commission_pct: number; iva_pct?: number }>;
  device_fingerprint?: { organization_id: string; merchant_id: string };
};
export type PaywayPaymentMethod = {
  id: number;
  brand: string;
  name: string;
  type: "credit" | "debit" | "prepaid";
};
export type CardInput = {
  number: string;
  holder: string;
  dni: string;
  expiry: string;
  cvv: string;
  type?: "credit" | "debit";
};
export type ProviderCard = {
  id: string;
  provider?: string;
  provider_card_token?: string;
  getnet_card_token?: string | null;
  payway_payment_method_id?: number;
  card_bin?: string;
};

export const getCardConfig = () =>
  apiClient<CardConfig>(`${API_BASE_URL}/api/payments/card-config`);

export const validateCardholder = (holder: string, dni: string) =>
  apiClient<{ matches: true }>(
    `${API_BASE_URL}/api/identity-verification/me/cardholder-check`,
    {
      method: "POST",
      body: { card_holder_name: holder.trim(), card_holder_dni: dni.trim() },
    },
  );

export function paywayMethodId(
  number: string,
  type: string,
  methods?: PaywayPaymentMethod[],
) {
  const brand = /^4/.test(number)
    ? "visa"
    : /^(5[1-5]|2[2-7])/.test(number)
      ? "mastercard"
      : /^3[47]/.test(number)
        ? "amex"
        : /^(5896|6042|6043)/.test(number)
          ? "cabal"
          : /^(50|5[6-9]|6)/.test(number) && type === "debit"
            ? "maestro"
            : null;
  const method = methods?.find(
    (method) => method.brand === brand && method.type === type,
  );
  if (!method)
    throw new Error(
      "No se encontró este medio de pago Payway. Actualizá el checkout y revisá el tipo de tarjeta.",
    );
  return method.id;
}

export async function tokenizePayway(
  config: CardConfig,
  input: CardInput,
  saved?: ProviderCard,
) {
  if (config.provider !== "payway") {
    throw new Error("Payway no está configurado.");
  }
  const publicKey = process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY?.trim();
  const environment = process.env.NEXT_PUBLIC_PAYWAY_ENVIRONMENT?.trim();
  if (
    !publicKey ||
    (environment !== "sandbox" && environment !== "production")
  ) {
    throw new Error(
      "Configurá NEXT_PUBLIC_PAYWAY_PUBLIC_KEY y NEXT_PUBLIC_PAYWAY_ENVIRONMENT en la web.",
    );
  }
  if (config.environment && config.environment !== environment) {
    throw new Error(
      "El entorno de Payway de la web no coincide con el de la API.",
    );
  }
  if (!/^\d{3,4}$/.test(input.cvv))
    throw new Error("Ingresá el código de seguridad de la tarjeta.");
  if (saved && saved.provider !== "payway")
    throw new Error("Esta tarjeta está guardada en otro proveedor.");
  if (!saved) await validateCardholder(input.holder, input.dni);
  const deviceFingerprintId = await collectPaywayDeviceFingerprint(config.device_fingerprint);
  const number = input.number.replace(/\D/g, "");
  const configuredMethodId =
    saved?.payway_payment_method_id ||
    paywayMethodId(number, input.type || "credit", config.payment_methods);
  const [month, year] = input.expiry.split("/");
  const body = saved
    ? { token: saved.provider_card_token, security_code: input.cvv }
    : {
        card_number: number,
        card_expiration_month: month,
        card_expiration_year: year?.slice(-2),
        security_code: input.cvv,
        card_holder_name: input.holder,
        card_holder_identification: { type: "dni", number: input.dni },
      };
  // Same-origin route avoids Payway's failing browser CORS preflight.
  let response: Response;
  try {
    response = await fetch("/api/payments/payway/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, fraud_detection: { device_unique_identifier: deviceFingerprintId } }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor de pagos. Reintentá en unos instantes.",
    );
  }
  const result = await response.json().catch(() => null);
  if (response.status === 502 || response.status === 503) {
    throw new Error(result?.message || "No se pudo conectar con Payway.");
  }
  if (!response.ok || !result?.id)
    throw new Error("Payway no pudo tokenizar la tarjeta. Revisá sus datos.");
  const methodId =
    saved?.payway_payment_method_id ||
    Number(result.payment_method_id) ||
    configuredMethodId;
  if (!methodId)
    throw new Error("Payway no informó el medio de pago de la tarjeta.");
  return {
    payment_method: "payway_card" as const,
    card_token: String(result.id),
    payway_device_fingerprint_id: deviceFingerprintId,
    card_bin: saved?.card_bin || String(result.bin || number.slice(0, 6)),
    payway_payment_method_id: methodId,
    saved_payment_method_id: saved?.id,
    card_holder_name: saved ? undefined : input.holder,
    card_holder_dni: saved ? undefined : input.dni,
  };
}
