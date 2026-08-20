import type { RawAxiosRequestHeaders } from "axios";
import { cookies } from "next/headers";

type ActionContext = {
  headers?: RawAxiosRequestHeaders | Record<string, unknown>;
};

export async function buildActionHeaders(
  ctx: ActionContext,
  token?: string,
): Promise<RawAxiosRequestHeaders> {
  const rawHeaders = (ctx?.headers ?? {}) as Record<string, unknown>;
  const baseHeaders = Object.fromEntries(
    Object.entries(rawHeaders).map(([key, value]) => [key, String(value)]),
  ) as RawAxiosRequestHeaders;

  // SIEMPRE leer la cookie del servidor primero: es la única fuente que se
  // actualiza cuando el backend rota el JWT. El token que viene del cliente
  // puede estar desactualizado y causar el error "unrecognized JWT kid".
  let finalToken: string | undefined;
  try {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get("access_token");
    if (accessCookie?.value) {
      finalToken = accessCookie.value;
    }
  } catch {
    // Si no estamos en un contexto que permite leer cookies (edge case),
    // usar el token del cliente como fallback.
    finalToken = undefined;
  }

  // Fallback: si la cookie no existe, usar el token del cliente
  if (!finalToken && token && token !== "$undefined" && token !== "undefined") {
    finalToken = token;
  }

  if (!finalToken) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${finalToken}`,
  };
}
