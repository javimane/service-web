import { NextRequest } from "next/server";
import { apiAccessToken, apiCookieHeader, parseApiCookies } from "@/utils/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  // This endpoint uses browser cookies, so mutations must originate here.
  const origin = request.headers.get("origin");
  if (!["GET", "HEAD"].includes(request.method) &&
      ((origin && origin !== request.nextUrl.origin) ||
       request.headers.get("sec-fetch-site") === "cross-site")) {
    return Response.json({ message: "Invalid request origin" }, { status: 403 });
  }

  const { path } = await context.params;
  if (path.some((segment) => !segment || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return Response.json({ message: "Invalid API path" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const target = new URL(`${base.replace(/\/$/, "")}/api/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of ["accept", "content-type", "accept-language", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const requestCookies = parseApiCookies(request.headers.get("cookie"));
  const cookieHeader = apiCookieHeader(requestCookies);
  if (cookieHeader) headers.set("cookie", cookieHeader);
  const accessToken = apiAccessToken(requestCookies);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const apiKey = process.env.WEB_API_KEY || process.env.NEXT_PUBLIC_WEB_API_KEY || process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) headers.set("x-api-key", apiKey);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "content-disposition", "location", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      // Keep shared production domains; adapt API-only domains for local or
      // preview hosts so login/refresh cookies reach subsequent server calls.
      const adapted = cookie.replace(/;\s*Domain=([^;]+)/i, (attribute, domain: string) => {
        const hostname = request.nextUrl.hostname;
        const cookieDomain = domain.trim().replace(/^\./, "").toLowerCase();
        return hostname === cookieDomain || hostname.endsWith(`.${cookieDomain}`) ? attribute : "";
      });
      responseHeaders.append("set-cookie", adapted);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: "No se pudo conectar con la API" }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD };
