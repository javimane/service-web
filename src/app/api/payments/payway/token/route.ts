import { request as httpsRequest } from "node:https";
import * as tls from "node:tls";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const maxBodyBytes = 4096;

type PaywayTokenResponse = {
  id?: string;
  token?: string;
  bin?: string;
  payment_method_id?: number;
};

function sendToPayway(url: string, key: string, body: string): Promise<{ status: number; response: string }> {
  return new Promise((resolve, reject) => {
    // Some local Node installations need the Windows CA store for Payway's certificate.
    const systemCertificates = typeof tls.getCACertificates === "function"
      ? tls.getCACertificates("system")
      : [];
    const request = httpsRequest(url, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      ...(systemCertificates.length > 0
        ? { ca: [...tls.rootCertificates, ...systemCertificates] }
        : {}),
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 16_384) {
          request.destroy(new Error("Payway response too large"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({
        status: response.statusCode ?? 502,
        response: Buffer.concat(chunks).toString("utf8"),
      }));
      response.on("error", reject);
    });
    request.on("error", reject);
    request.setTimeout(30_000, () => request.destroy(new Error("Payway timeout")));
    request.end(body);
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ message: "Origen inválido" }, { status: 403, headers: noStore });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ message: "Se requiere JSON" }, { status: 415, headers: noStore });
  }
  const key = process.env.NEXT_PUBLIC_PAYWAY_PUBLIC_KEY?.trim();
  const environment = process.env.NEXT_PUBLIC_PAYWAY_ENVIRONMENT?.trim();
  if (!key || (environment !== "sandbox" && environment !== "production")) {
    return Response.json({ message: "Payway no está configurado" }, { status: 503, headers: noStore });
  }
  if (Number(request.headers.get("content-length")) > maxBodyBytes) {
    return Response.json({ message: "Solicitud demasiado grande" }, { status: 413, headers: noStore });
  }

  let body: string;
  try {
    body = await request.text();
    if (Buffer.byteLength(body) > maxBodyBytes || !body.trim()) {
      return Response.json({ message: "Datos de tarjeta inválidos" }, { status: 400, headers: noStore });
    }
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || !/^\d{3,4}$/.test(parsed.security_code)) {
      return Response.json({ message: "Datos de tarjeta inválidos" }, { status: 400, headers: noStore });
    }
    const deviceId = parsed.fraud_detection?.device_unique_identifier;
    if (typeof deviceId !== 'string' || !/^[A-Za-z0-9_-]{1,88}$/.test(deviceId)) {
      return Response.json({ message: 'No se pudo validar el dispositivo para el pago' }, { status: 400, headers: noStore });
    }
    const fraudDetection = { device_unique_identifier: deviceId };
    if (typeof parsed.token === "string" && parsed.token.length > 0 && parsed.token.length <= 256) {
      body = JSON.stringify({ token: parsed.token, security_code: parsed.security_code, fraud_detection: fraudDetection });
    } else if (
      /^\d{13,19}$/.test(parsed.card_number) &&
      /^(0[1-9]|1[0-2])$/.test(parsed.card_expiration_month) &&
      /^\d{2}$/.test(parsed.card_expiration_year) &&
      typeof parsed.card_holder_name === "string" && parsed.card_holder_name.trim().length > 0 &&
      /^\d{7,11}$/.test(parsed.card_holder_identification?.number)
    ) {
      body = JSON.stringify({
        card_number: parsed.card_number,
        card_expiration_month: parsed.card_expiration_month,
        card_expiration_year: parsed.card_expiration_year,
        security_code: parsed.security_code,
        card_holder_name: parsed.card_holder_name.trim(),
        card_holder_identification: {
          type: "dni",
          number: parsed.card_holder_identification.number,
        },
        fraud_detection: fraudDetection,
      });
    } else {
      return Response.json({ message: "Datos de tarjeta inválidos" }, { status: 400, headers: noStore });
    }
  } catch {
    return Response.json({ message: "Datos de tarjeta inválidos" }, { status: 400, headers: noStore });
  }

  const baseUrl = environment === "production"
    ? "https://ventasonline.payway.com.ar/api/v2"
    : "https://developers-ventasonline.payway.com.ar/api/v2";
  try {
    const upstream = await sendToPayway(`${baseUrl}/tokens`, key, body);
    if (upstream.status < 200 || upstream.status >= 300) {
      return Response.json({ message: "Payway rechazó la tokenización de la tarjeta" }, { status: 502, headers: noStore });
    }
    const result = JSON.parse(upstream.response) as PaywayTokenResponse;
    const id = result.id || result.token;
    if (!id) {
      return Response.json({ message: "Payway no devolvió un token" }, { status: 502, headers: noStore });
    }
    return Response.json({ id, bin: result.bin, payment_method_id: result.payment_method_id }, { headers: noStore });
  } catch {
    return Response.json({ message: "No se pudo conectar con Payway" }, { status: 502, headers: noStore });
  }
}
