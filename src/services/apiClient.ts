import axios, { InternalAxiosRequestConfig } from "axios";

const isBrowser = typeof window !== "undefined";

// Create axios instance
const axiosInstance = axios.create({
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Prevent caching of API requests
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    if (!isBrowser) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;
        const refresh_token = cookieStore.get("refresh_token")?.value;

        const cookieArray: string[] = [];
        if (access_token) cookieArray.push(`access_token=${access_token}`);
        if (refresh_token) cookieArray.push(`refresh_token=${refresh_token}`);

        if (cookieArray.length > 0) {
          config.headers.Cookie = cookieArray.join("; ");
        }
      } catch (e) {
        // Ignore error if not in Next.js SSR context
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

    if (error.response?.status === 401 && !originalRequest._retry) {
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

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
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
            const access_token = cookieStore.get("access_token")?.value;
            const refresh_token = cookieStore.get("refresh_token")?.value;
            const cookieArray: string[] = [];
            if (access_token) cookieArray.push(`access_token=${access_token}`);
            if (refresh_token) cookieArray.push(`refresh_token=${refresh_token}`);
            if (cookieArray.length > 0) {
              refreshHeaders.Cookie = cookieArray.join("; ");
            }
          } catch (e) {
            // Ignorar
          }
        }

        const refreshResponse = await axios.post(refreshUrl, {}, { 
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
          const isRefreshEndpoint = originalRequest.url?.includes("/api/auth/refresh");
          const isLoginEndpoint = originalRequest.url?.includes("/api/auth/login");
          
          // Force logout if we explicitly see a refresh token already used error, or if we were logged in
          const isAlreadyUsedError = 
            err?.response?.data?.error_code === 'refresh_token_already_used' || 
            err?.response?.data?.msg?.includes('Already Used') ||
            err?.message?.includes('refresh_token_already_used');

          if ((!isRefreshEndpoint && !isLoginEndpoint) || isAlreadyUsedError) {
            localStorage.removeItem("was_logged_in");
            window.dispatchEvent(new CustomEvent("session-expired"));
          }
        }
        
        return Promise.reject(err);
      }
    }

    const message =
      error.response?.data?.message || error.message || "Error de red";
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
