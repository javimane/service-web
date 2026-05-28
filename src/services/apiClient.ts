import axios, { InternalAxiosRequestConfig } from "axios";

const isBrowser = typeof window !== "undefined";

// Create axios instance
const axiosInstance = axios.create({
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
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
        
        await axios.post(refreshUrl, {}, { withCredentials: true });
        
        isRefreshing = false;
        processQueue(null, "refreshed");
        
        // El nuevo token ya está en la cookie, así que reintentamos
        return axiosInstance(originalRequest);
      } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
        
        if (isBrowser) {
          window.dispatchEvent(new CustomEvent("session-expired"));
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
