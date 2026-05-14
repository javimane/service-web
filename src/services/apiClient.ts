import axios, { InternalAxiosRequestConfig } from "axios";

const isBrowser = typeof window !== "undefined";

// Create axios instance
const axiosInstance = axios.create({
  withCredentials: true,
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = isBrowser ? localStorage.getItem("access_token") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and automatically save tokens
axiosInstance.interceptors.response.use(
  (response) => {
    // Automatically save token if present in response (standard Supabase/API structure)
    const session = response.data?.data?.session || response.data?.session;
    if (isBrowser && session?.access_token) {
      localStorage.setItem("access_token", session.access_token);
    }
    if (isBrowser && session?.refresh_token) {
      localStorage.setItem("refresh_token", session.refresh_token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const token = isBrowser ? localStorage.getItem("access_token") : null;
      if (token) {
        window.dispatchEvent(new CustomEvent("session-expired"));
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
