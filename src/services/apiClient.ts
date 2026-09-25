import axios, { InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "../utils/auth";

const isBrowser = typeof window !== "undefined";

// Create axios instance
const axiosInstance = axios.create({
  withCredentials: true,
});

let currentApiAccessToken: string | undefined;

/**
 * Allows client views to explicitly provide the API JWT for their requests.
 * The HttpOnly access_token cookie remains the fallback for the proxy.
 */
export function setApiAccessToken(token?: string): void {
  currentApiAccessToken = token;
}

// API sessions travel as cookies; their value is not necessarily a JWT.
export { isSupabaseToken } from "../utils/apiAuth";
import { apiAccessToken, apiCookieHeader, browserApiUrl, parseApiCookies, stripApiTokenHeaders } from "../utils/apiAuth";

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Prevent caching of API requests
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    const apiKey =
      process.env.WEB_API_KEY ||
      process.env.NEXT_PUBLIC_WEB_API_KEY ||
      process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) {
      config.headers["x-api-key"] = apiKey;
    }

    stripApiTokenHeaders(config.headers);
    for (const name of Object.keys(config.headers)) {
      if (name.toLowerCase() === "cookie") delete config.headers[name];
    }
    if (isBrowser) {
      const token = currentApiAccessToken || getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    if (isBrowser && config.url) {
      config.url = browserApiUrl(config.url);
    }
    if (!isBrowser) {
      try {
        const { cookies, headers } = await import("next/headers");
        const requestCookies = [
          ...(await cookies()).getAll(),
          ...parseApiCookies((await headers()).get("cookie")),
        ];
        const cookieHeader = apiCookieHeader(requestCookies);
        const accessToken = apiAccessToken(requestCookies);
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
        if (cookieHeader) config.headers.Cookie = cookieHeader;
      } catch {
        // No request cookie store outside Next.js request scope.
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle errors and automatically refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !/\/api\/(?:backend\/)?auth\/(login|register|sync-oauth|refresh)(?:[/?]|$)/.test(originalRequest.url || "")) {
      // Si estamos en el servidor, verificar si podemos escribir cookies (Server Actions / Route Handlers)
      // Si no podemos (SSR page render), no refrescamos para no desincronizar/rotar el token
      if (!isBrowser) {
        let canWrite = false;
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          cookieStore.set("temp_write_test", "1");
          cookieStore.delete("temp_write_test");
          canWrite = true;
        } catch (e) {
          canWrite = false;
        }
        
        if (!canWrite) {
          return Promise.reject(error);
        }
      }

      if (isBrowser && isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest._retry = true;
            if (originalRequest.headers) {
              delete originalRequest.headers.Authorization;
              delete originalRequest.headers.authorization;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshUrl =
          (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000") +
          "/api/auth/refresh";
        
        const refreshHeaders: any = {};
        if (!isBrowser) {
          try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const cookieHeader = apiCookieHeader(cookieStore.getAll());
            if (cookieHeader) refreshHeaders.Cookie = cookieHeader;
          } catch (e) {
            // Ignorar
          }
        }

        const refreshResponse = await axios.post(isBrowser ? browserApiUrl(refreshUrl) : refreshUrl, {}, { 
          withCredentials: true,
          headers: refreshHeaders
        });
        
        if (!isBrowser) {
          try {
            const setCookieHeaders = refreshResponse.headers["set-cookie"];
            if (setCookieHeaders) {
              const { cookies } = await import("next/headers");
              const cookieStore = await cookies();
              const cookiesArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
              
              for (const cookieStr of cookiesArray) {
                const parts = cookieStr.split(";")[0].split("=");
                if (parts.length >= 2) {
                  const name = parts[0].trim();
                  const value = parts.slice(1).join("=").trim();
                  
                  const options: any = {
                    httpOnly: true,
                    path: "/",
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                  };
                  
                  const maxAgeMatch = cookieStr.match(/Max-Age=([^;]+)/i);
                  if (maxAgeMatch) {
                    options.maxAge = parseInt(maxAgeMatch[1], 10);
                  }
                  
                  cookieStore.set(name, value, options);

                }
              }
            }
          } catch (e) {
            // Ignorar
          }
        }
        // Browser applies Set-Cookie itself. Never promote a chat session from
        // the response body into API cookies or localStorage.
        
        if (originalRequest.headers) {
          delete originalRequest.headers.Authorization;
          delete originalRequest.headers.authorization;
        }

        isRefreshing = false;
        processQueue(null, "refreshed");
        
        // El nuevo token ya está en la cookie, así que reintentamos
        return axiosInstance(originalRequest);
      } catch (err: any) {
        isRefreshing = false;
        processQueue(err, null);
        
        if (isBrowser) {
          const isRefreshEndpoint = /\/api\/(?:backend\/)?auth\/refresh/.test(originalRequest.url || "");
          const isLoginEndpoint = /\/api\/(?:backend\/)?auth\/login/.test(originalRequest.url || "");
          const isSessionEndpoint = /\/api\/(?:backend\/)?auth\/session/.test(originalRequest.url || "");
          
          // Force logout if we explicitly see a refresh token already used error, or if we were logged in
          const isAlreadyUsedError = 
            err?.response?.data?.error_code === 'refresh_token_already_used' || 
            err?.response?.data?.msg?.includes('Already Used') ||
            err?.message?.includes('refresh_token_already_used');

          const wasLoggedIn = localStorage.getItem("was_logged_in") === "true";
          const isAuthPage =
            window.location.pathname.includes("/login") ||
            window.location.pathname.includes("/register");

          if (!isAuthPage && !isSessionEndpoint && ((!isRefreshEndpoint && !isLoginEndpoint && wasLoggedIn) || isAlreadyUsedError)) {
            localStorage.removeItem("was_logged_in");
            window.dispatchEvent(new CustomEvent("session-expired"));
          }
        }
        
        return Promise.reject(err);
      }
    }

    const responseMessage = error.response?.data?.message;
    const message = Array.isArray(responseMessage)
      ? responseMessage.join(". ")
      : responseMessage || error.message || "Error de red";
    return Promise.reject(new Error(message));
  },
);

/**
 * Compatible wrapper for the previous fetch-based apiClient
 * This allows keeping existing services without major changes
 */
export async function apiClient<T>(url: string, options: any = {}): Promise<T> {
  const { method = "GET", body, headers, ...rest } = options;

  let data = body;
  // If body is a JSON string (as used in previous fetch-based implementation), parse it
  if (typeof body === "string") {
    try {
      data = JSON.parse(body);
    } catch (e) {
      // Not a JSON string or already an object (axios handles both)
    }
  }

  const response = await axiosInstance({
    url,
    method,
    data,
    headers,
    ...rest,
  });

  return response.data;
}

export default axiosInstance;
