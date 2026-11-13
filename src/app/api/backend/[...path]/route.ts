import { NextRequest } from "next/server";
import { apiAccessToken, apiCookieHeader, parseApiCookies } from "@/utils/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

const productionWebOrigins = new Set([
  "https://sercio.com.ar",
  "https://www.sercio.com.ar",
]);

async function forward(request: NextRequest, context: RouteContext) {
  // This endpoint uses browser cookies, so mutations must originate here.
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  // Amplify can give Next.js an internal URL while the browser sees Sercio.
  const publicOrigin =
    origin && fetchSite === "same-origin" && productionWebOrigins.has(origin)
      ? new URL(origin)
      : null;
  if (!["GET", "HEAD"].includes(request.method) &&
      ((origin && origin !== request.nextUrl.origin && !publicOrigin) ||
       fetchSite === "cross-site")) {
    return Response.json({ message: "Invalid request origin" }, { status: 403 });
  }

  const { path } = await context.params;
  if (path.some((segment) => !segment || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return Response.json({ message: "Invalid API path" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const target = new URL(`${base.replace(/\/$/, "")}/api/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;
  const isLogout = request.method === "POST" && path.join("/") === "auth/logout";
  const webUrl = publicOrigin ?? request.nextUrl;
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  if (isLogout) {
    const secure = webUrl.protocol === "https:" ? "; Secure" : "";
    for (const name of ["access_token", "refresh_token", "token"]) {
      const expired = `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
      responseHeaders.append("set-cookie", expired);
      if (productionWebOrigins.has(webUrl.origin)) {
        responseHeaders.append("set-cookie", `${expired}; Domain=sercio.com.ar`);
      }
    }
  }

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
    for (const name of ["content-type", "content-disposition", "location", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    for (const cookie of isLogout ? [] : upstream.headers.getSetCookie()) {
      // Keep shared production domains; adapt API-only domains for local or
      // preview hosts so login/refresh cookies reach subsequent server calls.
      const adapted = cookie.replace(/;\s*Domain=([^;]+)/i, (attribute, domain: string) => {
        const hostname = publicOrigin?.hostname ?? request.nextUrl.hostname;
        const cookieDomain = domain.trim().replace(/^\./, "").toLowerCase();
        return hostname === cookieDomain || hostname.endsWith(`.${cookieDomain}`) ? attribute : "";
      });
      responseHeaders.append("set-cookie", adapted);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ message: "No se pudo conectar con la API" }, { status: 502, headers: responseHeaders });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD };
